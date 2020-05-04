import OlVector from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { fromCircle } from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';
import OlGeoJSON from 'ol/format/GeoJSON';
import booleanDisjoint from '@turf/boolean-disjoint';
import { IQueryRequest, IQueryResponse, IExtendedOptions, IExtended } from './IExtended';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { Options } from 'ol/source/Vector';

export interface IVectorOptions extends IExtendedOptions, Options {}

export abstract class Vector extends OlVector implements IExtended {
  protected options: IVectorOptions;

  protected oldProjectionCode: string;

  protected actualProjectionCode: string;

  private queryGeoJSONFormat = new OlGeoJSON();

  constructor(options: IVectorOptions) {
    super({ ...options } as any);
    this.options = { ...options };
  }

  public init(): Promise<void> {
    return Promise.resolve();
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
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }

  public loadFeatures(extent: [number, number, number, number], resolution: number, projection: Projection) {
    if (projection != null && this.oldProjectionCode !== projection.getCode()) {
      this.oldProjectionCode = this.actualProjectionCode;
      this.actualProjectionCode = projection.getCode();
    }
    super.loadFeatures(extent, resolution, projection);
  }

  public query(request: IQueryRequest): Promise<IQueryResponse> {
    const { olMap, geometry, geometryProjection, limit } = request;
    const features = [] as Feature[];
    let destGeometry = null;
    const mapProjection = olMap.getView().getProjection();
    if (geometry != null) {
      if (mapProjection != null && geometryProjection != null) {
        destGeometry = geometry.transform(geometryProjection, mapProjection);
      } else {
        destGeometry = geometry;
      }
      if (destGeometry.getType() === 'Circle') {
        destGeometry = fromCircle(geometry as Circle);
      }
      const extent = destGeometry.getExtent();
      const jsonGeom = this.queryGeoJSONFormat.writeGeometryObject(destGeometry);
      this.forEachFeatureIntersectingExtent(extent, (feature: Feature) => {
        if (limit == null || features.length < limit) {
          const jsonResGeom = this.queryGeoJSONFormat.writeGeometryObject(feature.getGeometry());
          if (!booleanDisjoint(jsonResGeom as any, jsonGeom as any)) {
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
          features: [],
          source: this,
        },
      ],
    });
  }

  public retrieveFeature(id: number | string, projection: Projection): Promise<Feature> {
    return Promise.resolve(this.getFeatureById(id));
  }
}
