import { IExtended, IFeatureType, IIdentifyRequest, IQueryRequest } from '../../IExtended';
import { transformExtent } from 'ol/proj';
import { getForViewAndSize } from 'ol/extent';
import { FilterBuilder, FilterBuilderTypeEnum } from '../../../filter';
import EsriJSON from 'ol/format/EsriJSON';
import { fromCircle } from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';

export interface AgsIdentifyRequestParameters {
  f: string;
  geometry: string;
  geometryType: string;
  sr: string;
  layerDefs: string;
  layers: string;
  tolerance: string;
  mapExtent: string;
  imageDisplay: string;
  returnGeometry: string;
  maxAllowableOffset: string;
  geometryPrecision: string;
  returnZ: string;
  returnM: string;
  returnFieldName: string;
}

export class AgsIdentifyRequest implements AgsIdentifyRequestParameters {
  f: string;
  geometry: string;
  geometryPrecision: string;
  geometryType: string;
  imageDisplay: string;
  layerDefs: string;
  layers: string;
  mapExtent: string;
  maxAllowableOffset: string;
  returnFieldName: string;
  returnGeometry: string;
  returnM: string;
  returnZ: string;
  sr: string;
  tolerance: string;

  private format = new EsriJSON();

  constructor(source: IExtended, type: IFeatureType<number>, request: IQueryRequest) {
    const { olMap, geometryProjection, queryType } = request;
    this.sr = '3857';

    if ((request as IIdentifyRequest).srId) {
      this.sr = (request as IIdentifyRequest).srId;
    }

    this.returnFieldName = !!(request as IIdentifyRequest).returnFieldName
      ? (request as IIdentifyRequest).returnFieldName
      : 'true';
    this.returnGeometry = !!(request as IIdentifyRequest).returnGeometry
      ? (request as IIdentifyRequest).returnGeometry
      : 'true';

    let geometry = request.geometry;
    if (geometry) {
      if (geometry.getType() === 'Circle') {
        geometry = fromCircle(geometry as Circle);
      }
      const geometryStr = this.format.writeGeometry(geometry, {
        featureProjection: geometryProjection,
        dataProjection: 'EPSG:' + this.sr,
      });
      let geometryType = '';
      switch (geometry.getType()) {
        case 'Point':
          geometryType = 'esriGeometryPoint';
          break;
        case 'LineString':
          geometryType = 'esriGeometryPolyline';
          break;
        case 'LinearRing':
          geometryType = 'esriGeometryPolyline';
          break;
        case 'Polygon':
          geometryType = 'esriGeometryPolygon';
          break;
        case 'MultiPoint':
          geometryType = 'esriGeometryMultipoint';
          break;
        case 'MultiLineString':
          geometryType = 'esriGeometryPoint';
          break;
        case 'MultiPolygon':
          geometryType = 'esriGeometryPolygon';
          break;
      }

      this.geometry = geometryStr;
      this.geometryType = geometryType;
      this.geometryPrecision = !!(request as IIdentifyRequest).geometryPrecision
        ? `${(request as IIdentifyRequest).geometryPrecision}`
        : '10';
    }

    const olView = olMap.getView();

    const { identifyTolerance, layersPrefix = 'all' } = request as IIdentifyRequest;
    const extent = transformExtent(geometry.getExtent(), geometryProjection, 'EPSG:' + this.sr);
    const mapExtent = getForViewAndSize(
      [0.5 * extent[0] + 0.5 * extent[2], 0.5 * extent[1] + 0.5 * extent[3]],
      olView.getResolution(),
      0,
      [1001, 1001]
    );
    this.mapExtent = mapExtent.join(',');
    this.imageDisplay = '1001,1001';
    this.layers = `${layersPrefix}:${type.id}`;
    if (request.filters) {
      this.layerDefs = `{"${type.id}":"${new FilterBuilder(request.filters).build(FilterBuilderTypeEnum.SQL)}"}`;
    }
    if (Math.round(identifyTolerance) > 0) {
      this.tolerance = `${Math.round(identifyTolerance)}`;
    } else {
      this.tolerance = '4';
    }
    this.f = 'json';
  }

  public getSrId(): string {
    return this.sr;
  }
}
