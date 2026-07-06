import WKT from 'ol/format/WKT';
import Circle from 'ol/geom/Circle';
import Geometry from 'ol/geom/Geometry';
import { fromCircle } from 'ol/geom/Polygon';

/**
 * Utils for format WKT.
 */
export class WktUtils {
  private static readonly wktFormat = new WKT();

  private constructor() {
    throw new Error('This class cannot be instantiated');
  }

  /**
   * Transform WKT geometry to OpenLayers geometry
   * @param {wktGeometry} wktGeometry
   * @return  {Geometry} geometry
   */
  public static toOpenLayersGeometry(wktGeometry: string): Geometry {
    return WktUtils.wktFormat.readGeometry(wktGeometry);
  }

  /**
   * Transform OpenLayers geometry to GeoJSON geometry
   * @param {Geometry} geometry
   * @return  {string} WKT geometry
   */
  public static toWktGeometry(geometry: Geometry): string {
    let writableGeometry: Geometry;

    // Handle case of circle : convert to polygon
    if (geometry.getType() === 'Circle') {
      writableGeometry = fromCircle(geometry as Circle);
    } else {
      writableGeometry = geometry;
    }

    // Write geometry in GeoJSON
    return WktUtils.wktFormat.writeGeometry(writableGeometry);
  }
}
