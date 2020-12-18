import { IExtended, IFeatureType, IIdentifyRequest, IQueryRequest } from '../../IExtended';
import { fromCircle } from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';
import { FilterBuilder, FilterBuilderTypeEnum } from '../../../filter';
import EsriJSON from 'ol/format/EsriJSON';

interface AgsQueryRequestParameters {
  f: string;
  text: string;
  geometry: string;
  geometryType: string;
  inSR: string;
  spatialRel: string;
  relationParam: string;
  where: string;
  objectIds: string;
  time: string;
  distance: string;
  units: string;
  outFields: string;
  returnGeometry: string;
  maxAllowableOffset: string;
  geometryPrecision: string;
  outSR: string;
  returnIdsOnly: string;
  returnCountOnly: string;
  returnExtentOnly: string;
  orderByFields: string;
  returnZ: string;
  returnM: string;
  resultOffset: string;
  rangeValues: string;
  parameterValues: string;
  historicMoment: string;
}

export class AgsQueryRequest implements AgsQueryRequestParameters {
  f: string;
  distance: string;
  geometry: string;
  geometryPrecision: string;
  geometryType: string;
  historicMoment: string;
  inSR: string;
  maxAllowableOffset: string;
  objectIds: string;
  orderByFields: string;
  outFields: string;
  outSR: string;
  parameterValues: string;
  rangeValues: string;
  relationParam: string;
  resultOffset: string;
  returnCountOnly: string;
  returnExtentOnly: string;
  returnGeometry: string;
  returnIdsOnly: string;
  returnM: string;
  returnZ: string;
  spatialRel: string;
  text: string;
  time: string;
  units: string;
  where: string;

  private format = new EsriJSON();

  constructor(source: IExtended, type: IFeatureType<number>, request: IQueryRequest) {
    const { geometryProjection } = request;
    this.inSR = '3857';
    this.outSR = '3857';

    if ((request as IIdentifyRequest).srId) {
      this.inSR = (request as IIdentifyRequest).srId;
      this.outSR = (request as IIdentifyRequest).srId;
    }

    this.outFields = '*';
    this.returnGeometry = !!(request as IIdentifyRequest).returnGeometry ? 'true' : 'false';

    let geometry = request.geometry;
    if (geometry) {
      if (geometry.getType() === 'Circle') {
        geometry = fromCircle(geometry as Circle);
      }
      const geometryStr = this.format.writeGeometry(geometry, {
        featureProjection: geometryProjection,
        dataProjection: 'EPSG:' + this.inSR,
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

    if (request.filters) {
      this.where = new FilterBuilder(request.filters).build(FilterBuilderTypeEnum.SQL);
    }
    this.f = 'json';
  }

  public getSrId(): string {
    return this.outSR;
  }
}
