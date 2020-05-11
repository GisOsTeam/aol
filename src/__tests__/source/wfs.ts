import { IWfsOptions, Wfs } from '../../source';
import { FeatureUrlFunction } from 'ol/featureloader';
import Projection from 'ol/proj/Projection';



describe('aol.wfs', () => {
  test('register', () => {
    const options: IWfsOptions = {
      url: 'https://dservices2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/services/Seattle_Downtown_Features/WFSServer',
      type: { id: 'Seattle_Downtown_Features:Buildings' },
      outputFormat: 'GEOJSON',
      version: '2.0.0'
    };
    const projection = new Projection({ code: 'EPSG:4326' })
    const wfsSource = new Wfs(options);
    expect((wfsSource.getUrl() as FeatureUrlFunction)([0, 0, 0, 0], 0, projection))
      .toEqual('https://dservices2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/services/Seattle_Downtown_Features/WFSServer?service=WFS&version=2.0.0&request=GetFeature&Type=Seattle_Downtown_Features:Buildings&outputFormat=GEOJSON&srsname=EPSG:4326&bbox=0,0,0,0,EPSG:4326');
  });
});
