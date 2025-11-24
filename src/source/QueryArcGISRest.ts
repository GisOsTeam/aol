import OlEsriJSON from 'ol/format/EsriJSON';
import { ExternalVector } from './ExternalVector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { ISnapshotOptions } from './IExtended';
import { Options } from 'ol/source/Vector';
import { HttpEngine, IHttpResponse } from '../HttpEngine';
import { FeatureUrlFunction as OlFeatureUrlFunction } from 'ol/featureloader';
import { Projection } from 'ol/proj';
import { Extent } from 'ol/extent';

export interface IQueryArcGISRestOptions extends ISnapshotOptions, Options<any> {}

/**
 * Build function returning dynamic URL depending on current map context.
 *
 * @param baseUrl Base URL of layer
 * @param where Optional Where clause
 * @returns URL function
 */
function getUrlFunction(baseUrl: string, where?: string): OlFeatureUrlFunction {
  return (extent: Extent, _resolution: number, projection: Projection): string => {
    const srid = projection.getCode().split(':').pop();

    let url = `${baseUrl}/query?f=json&returnGeometry=true&outFields=*&outSR=${srid}`;

    // BBOX filtering
    const filterByBbox: boolean =
      Array.isArray(extent) &&
      extent.length === 4 &&
      extent.every((extentValue: number) => typeof extentValue === 'number' && Number.isFinite(extentValue));
    if (filterByBbox) {
      const geometry: string = encodeURIComponent(
        JSON.stringify({
          xmin: extent[0],
          ymin: extent[1],
          xmax: extent[2],
          ymax: extent[3],
          spatialReference: { wkid: srid },
        }),
      );
      url += `&spatialRel=esriSpatialRelIntersects&geometry=${geometry}&geometryType=esriGeometryEnvelope&inSR=${srid}`;
    }

    // Where clause
    if (where) {
      url += `&where=${where}`;
    } else if (!filterByBbox) {
      // Need either bbox filtering or where clause
      url += '&where=1=1';
    }

    return url;
  };
}

function sanitizeOptionUrl(
  url: string | OlFeatureUrlFunction | undefined,
  where?: string,
): OlFeatureUrlFunction | undefined {
  // Case url string : make it url function with query management
  if (typeof url === 'string') {
    return getUrlFunction(url, where);
  }

  // Case url already function or undefined : no modification on it
  return url;
}

export class QueryArcGISRest extends ExternalVector {
  protected options: any;

  constructor(options: IQueryArcGISRestOptions) {
    super({
      ...options,
      // Format : force format Esri JSON for this source
      format: new OlEsriJSON(),
      // URL : if static URL provided, convert it to URL function with query management
      url: sanitizeOptionUrl(options.url, (options as any).where),
      // Loader : use provided loader of default using HttpEngine and handling Esri errors
      loader:
        options.loader ||
        (async (
          extent: Extent,
          resolution: number,
          projection: Projection,
          success?: (features: any[]) => void,
          failure?: () => void,
        ): Promise<void> => {
          return (
            HttpEngine.getInstance()
              .send({
                url: this.getEffectiveUrl(extent, resolution, projection.getCode()),
                method: 'GET',
                responseType: 'json',
              })
              // Handle famous ESRI errors wrapped in 200 HTTP responses
              .then((response: IHttpResponse) => {
                if ('error' in response.body) {
                  console.error('Silent ArcGIS REST query error (wrapped in response 200): ', response.body.error);
                  throw new Error('ArcGIS REST query error: ' + JSON.stringify(response.body.error));
                }
                return response;
              })
              .then((response: IHttpResponse) => this.getFormat().readFeatures(response.body))
              .then((features: any[]) => {
                this.addFeatures(features);
                if (success !== undefined) {
                  success(features);
                }
              })
              .catch(() => {
                this.changed();
                if (failure !== undefined) {
                  failure();
                }
              })
          );
        }),
    });
    this.options = { ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
    if (this.options.removable != false) {
      this.options.removable = true;
    }
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.QueryArcGISRest;
  }

  public getSourceOptions(): IQueryArcGISRestOptions {
    return this.options;
  }

  public setSourceOptions(options: IQueryArcGISRestOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Vector;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable;
  }

  public isListable(): boolean {
    return this.options.listable;
  }

  public isRemovable(): boolean {
    return this.options.removable;
  }

  public load(extent: Extent, projectionCode: string) {
    const url: string | undefined = this.getEffectiveUrl(extent, undefined, projectionCode);

    // Case URL undefined : error
    if (url === undefined) {
      return Promise.reject('URL undefined, loading by source loader not implemented yet');
    }

    return HttpEngine.getInstance()
      .send({ url, contentType: 'application/json' })
      .then(
        (response) => this.getFormat().readFeatures(response.body),
        () => {
          console.error(`Request error ${url}`);
        },
      );
  }

  /**
   * Get effective URL (string) for a given map context.
   *
   * @param extent Map view's current extent
   * @param resolution Map view's current resolution
   * @param projectionCode Map view's current projection code
   * @returns Effective URL string or undefined
   */
  private getEffectiveUrl(extent: Extent, resolution: number, projectionCode: string): string | undefined {
    const url = this.getUrl();

    // Case URL function : call it in order to retrieve string URL
    if (typeof url === 'function') {
      return url(extent, resolution, new Projection({ code: projectionCode }));
    }

    // Case URL undefined or string : no modification on it
    return url;
  }
}
