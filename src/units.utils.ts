import { Units as OlUnits } from 'ol/proj/Units';
import { Units as TurfUnits } from '@turf/helpers';

/**
 * Utils on units.
 */
export class UnitsUtils {
  private constructor() {
    throw new Error('This class cannot be instantiated');
  }

  /**
   * Transform WKT geometry to OpenLayers geometry
   * @param {wktGeometry} wktGeometry
   * @return  {Geometry} geometry
   */
  public static toTurfUnits(olUnits: OlUnits): TurfUnits {
    switch (olUnits) {
      case 'm':
        return 'meters';
      case 'degrees':
        return 'degrees';
      case 'ft':
      case 'us-ft':
        return 'feet';
      default:
        throw new Error(`Unsupported units : ${olUnits}`);
    }
  }
}
