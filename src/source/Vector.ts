import OlVector, { Options } from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { IGisRequest, IIdentifyRequest, IQueryResponse, IQuerySource, ISnapshotOptions } from './IExtended';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';
import { buffer, disjoint, toGeoJSONFeature } from '../utils';
import Geometry from 'ol/geom/Geometry';
import { DEFAULT_TOLERANCE } from './query';
import { fromCircle } from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';

export interface IVectorOptions extends ISnapshotOptions, Options {}

export abstract class Vector extends OlVector implements IQuerySource {
  protected options: IVectorOptions;

  protected oldProjectionCode: string;

  protected actualProjectionCode: string;

  constructor(options: IVectorOptions) {
    super({ ...options });
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
    return SourceTypeEnum.Vector;
  }

  public getSourceOptions(): IVectorOptions {
    return this.options;
  }

  public setSourceOptions(options: IVectorOptions): void {
    this.options = options;
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

  public loadFeatures(extent: [number, number, number, number], resolution: number, projection: Projection) {
    if (projection != null && this.oldProjectionCode !== projection.getCode()) {
      this.oldProjectionCode = this.actualProjectionCode;
      this.actualProjectionCode = projection.getCode();
    }
    super.loadFeatures(extent, resolution, projection);
  }

  public query(request: IGisRequest): Promise<IQueryResponse> {
    const { olMap, geometry, geometryProjection, limit } = request;
    const features = [] as Feature[];
    const olView = olMap.getView();
    const { identifyTolerance } = request as IIdentifyRequest;
    // Assignation de la résolution
    const resolution = olView.getResolution() == null ? 1 : olView.getResolution();
    // Assignation de la tolérance à appliquer
    const geoTolerance = (Math.round(identifyTolerance) > 0 ? identifyTolerance : DEFAULT_TOLERANCE) * resolution;
    let destGeometry: Geometry;
    const mapProjection = olMap.getView().getProjection();
    let projected = false;
    if (geometry != null) {
      if (mapProjection != null && geometryProjection != null) {
        destGeometry = geometry.clone().transform(geometryProjection, mapProjection);
        projected = true;
      } else {
        destGeometry = geometry.clone();
      }
      if (destGeometry.getType() === 'Circle') {
        destGeometry = fromCircle(geometry as Circle);
      }
      const extent = destGeometry.getExtent();
      this.forEachFeatureIntersectingExtent(extent, (feature: Feature) => {
        if (limit == null || features.length < limit) {
          const geoJSONFeature = toGeoJSONFeature(feature);
          const geoJSONGemetryBuffered = buffer(
            toGeoJSONFeature(new Feature<Geometry>(destGeometry.clone())),
            geoTolerance,
            projected ? mapProjection : null
          ).geometry;
          if (!disjoint(geoJSONFeature.geometry, geoJSONGemetryBuffered)) {
            features.push(feature);
          }
        }
      });
    } else {
      this.forEachFeature((feature: Feature) => {
        if (limit == null || features.length < limit) {
          features.push(feature);
        }
      });
    }
    return Promise.resolve({
      request,
      featureTypeResponses: [
        {
          type: null,
          features,
          source: this,
        },
      ],
    });
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    return Promise.resolve(this.getFeatureById(id));
  }
}
