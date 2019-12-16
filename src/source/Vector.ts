import OlVector from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { fromCircle } from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';
import OlGeoJSON from 'ol/format/GeoJSON';
import booleanDisjoint from '@turf/boolean-disjoint';
import { Feature as JsonFeature } from '@turf/helpers';
import { IQueryRequest, IQueryResponse, IExtendedOptions } from './IExtended';
import { IVector } from './IVector';
import { LayerType, LayerTypeEnum } from './types/layerType';
import { SourceType, SourceTypeEnum } from './types/sourceType';

export abstract class Vector extends OlVector implements IVector {
  protected options: IExtendedOptions;

  protected oldProjectionCode: string;

  protected actualProjectionCode: string;

  private queryGeoJSONFormat = new OlGeoJSON();

  constructor(options: IExtendedOptions = {}) {
    super({ ...options } as any);
    this.options = { ...options };
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.Vector;
  }

  public getSourceOptions(): IExtendedOptions {
    return this.options;
  }

  public setSourceOptions(options: IExtendedOptions): void {
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
      const jsonGeom = this.queryGeoJSONFormat.writeGeometryObject(destGeometry) as JsonFeature;
      this.forEachFeatureIntersectingExtent(extent, (feature: Feature) => {
        if (limit == null || features.length < limit) {
          const jsonResGeom = this.queryGeoJSONFormat.writeGeometryObject(feature.getGeometry()) as JsonFeature;
          if (!booleanDisjoint(jsonResGeom, jsonGeom)) {
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
          features
        }
      ]
    });
  }
}
