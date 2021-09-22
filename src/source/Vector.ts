import OlVector, { Options } from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { IGisRequest, IIdentifyRequest, IQueryResponse, IQuerySource, ISnapshotOptions } from './IExtended';
import { LayerType, LayerTypeEnum, SourceType, SourceTypeEnum } from './types';
import { disjoint, toGeoJSONFeature, toOpenLayersGeometry } from '../utils';
import Geometry from 'ol/geom/Geometry';
import { DEFAULT_TOLERANCE } from './query';
import { fromCircle } from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';
import { geodesicBuffer } from '../utils/geodesicBuffer';
import { GeoJSONFeature } from 'ol/format/GeoJSON';
import { ProjectionLike } from 'ol/proj';

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
    const { identifyTolerance } = request as IIdentifyRequest;
    // Assignation de la tolérance à appliquer
    const tolerance = Math.round(identifyTolerance) > 0 ? identifyTolerance : DEFAULT_TOLERANCE;
    const geoTolerance = tolerance * olMap.getView().getResolution();
    let destGeometry: Geometry;
    const mapProjection = olMap.getView().getProjection();
    if (geometry != null) {
      let projectionUsed: ProjectionLike;
      // On a définit une projection spécifique à la géométrie alors elle est présumée prioritaire
      if (geometryProjection != null) {
        destGeometry = geometry.clone().transform(geometryProjection, 'EPSG:4326');
        projectionUsed = geometryProjection;
      }
      // On a définit une map projection spécifique à la géométrie alors on l'utilise
      else if (mapProjection != null) {
        destGeometry = geometry.clone().transform(mapProjection, 'EPSG:4326');
        projectionUsed = mapProjection;
      }
      // La géométrie est présumée être en EPSG:4326
      else {
        destGeometry = geometry.clone();
        projectionUsed = 'EPSG:4326';
      }
      if (destGeometry.getType() === 'Circle') {
        destGeometry = fromCircle(geometry as Circle);
      }
      // Géométrie GeoJSON bufferisée en EPSG:4326
      const wgs84GeoJSONBuffured = (
        geodesicBuffer(
          toGeoJSONFeature(new Feature<Geometry>(destGeometry.clone())) as any,
          geoTolerance
        ) as GeoJSONFeature
      ).geometry;
      // Géométrie OpenLayers bufferisée en EPSG:4326
      const wgs84GeoOlBuffered = toOpenLayersGeometry(wgs84GeoJSONBuffured);
      // Géométrie OpenLayers bufferisée en projectionUsed
      const originalProjGeoOlBuffered = wgs84GeoOlBuffered.clone().transform('EPSG:4326', projectionUsed);
      // Géométrie GeoJSON bufferisée en projectionUsed
      const originalProjFeatureJSONBuffered = toGeoJSONFeature(
        new Feature<Geometry>(originalProjGeoOlBuffered.clone())
      );

      const extent = originalProjGeoOlBuffered.clone().getExtent();
      this.forEachFeatureIntersectingExtent(extent, (feature: Feature) => {
        if (limit == null || features.length < limit) {
          const geoJSONFeature = toGeoJSONFeature(feature);
          if (!disjoint(geoJSONFeature.geometry, originalProjFeatureJSONBuffered.geometry)) {
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
