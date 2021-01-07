import { send } from 'bhreq';
import { ISearchProvider, ISearchResult } from './ISearchProvider';
import GeoJSONFormat from 'ol/format/GeoJSON';
import { ProjectionLike } from 'ol/proj';
/*import { addProjection } from '../ProjectionInfo';
import Point from 'ol/geom/Point';*/

const geoJSONFormat = new GeoJSONFormat();

export class BanSearchProvider implements ISearchProvider {
  
  /*public constructor() {
    addProjection(
      'EPSG:2154',
      'PROJCS["RGF93 / Lambert-93",GEOGCS["RGF93",DATUM["Reseau_Geodesique_Francais_1993",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY["EPSG","6171"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4171"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",49],PARAMETER["standard_parallel_2",44],PARAMETER["latitude_of_origin",46.5],PARAMETER["central_meridian",3],PARAMETER["false_easting",700000],PARAMETER["false_northing",6600000],AUTHORITY["EPSG","2154"],AXIS["X",EAST],AXIS["Y",NORTH]]',
      [-9.86, 41.15, 10.38, 51.56],
      'RGF93 / Lambert-93'
    );
  }*/

  public search(txt: string, targetProjection: ProjectionLike): Promise<ISearchResult[]> {
    return send({
      url: `https://api-adresse.data.gouv.fr/search/?q=${txt}`,
    }).then((res) => {
      const features = geoJSONFormat.readFeatures(res.body, {
        dataProjection: 'EPSG:4326',
        featureProjection: targetProjection,
      });
      const searchResults: ISearchResult[] = [];
      if (features.length > 0) {
        for (const feature of features) {
          const properties = feature.getProperties();
          /*if (properties.x != null && properties.y != null) {
            const point = new Point([properties.x, properties.y]);
            point.transform('EPSG:2154', targetProjection);
            feature.setGeometry(point);
          }*/
          searchResults.push({
            name: properties.label,
            score: properties.score,
            id: properties.id,
            type: 'address',
            feature,
          });
        }
      }
      return searchResults;
    });
  }
}
