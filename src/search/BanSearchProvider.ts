import { send } from 'bhreq';
import { ISearchProvider, ISearchResult } from './ISearchProvider';
import GeoJSONFormat from 'ol/format/GeoJSON';
import { ProjectionLike } from 'ol/proj';

const geoJSONFormat = new GeoJSONFormat();

export class BanSearchProvider implements ISearchProvider {
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
          searchResults.push({
            name: properties.label,
            score: properties.score,
            id: properties.id,
            type: properties.type != null ? properties.type : 'address',
            feature,
          });
        }
      }
      return searchResults;
    });
  }
}
