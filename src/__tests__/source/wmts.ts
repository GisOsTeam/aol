import { WmtsProvider } from '../../source/provider';
import { Engine } from 'bhreq';

describe('aol.wmts', () => {
  test('provide sync', async () => {
    const request = {
      url: `https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS/1.0.0/WMTSCapabilities.xml`,
      method: 'GET',
    };
    const response = await Engine.getInstance().send(request);
    const sourceWmts = WmtsProvider.provideSync(response.text, {
      layer: 'WorldTimeZones',
      matrixSet: 'GoogleMapsCompatible',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS',
    });
    expect(sourceWmts.getLayer()).toEqual('WorldTimeZones');
    expect(sourceWmts.getMatrixSet()).toEqual('GoogleMapsCompatible');
    expect(sourceWmts.getUrls()).toEqual([
      'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS?',
    ]);
  });
  test('provide async with capabilitiesUrl', async () => {
    const sourceWmts = await WmtsProvider.provideAsync({
      capabilitiesUrl:
        'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS/1.0.0/WMTSCapabilities.xml',
      layer: 'WorldTimeZones',
      matrixSet: 'GoogleMapsCompatible',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS',
    });
    expect(sourceWmts.getLayer()).toEqual('WorldTimeZones');
    expect(sourceWmts.getMatrixSet()).toEqual('GoogleMapsCompatible');
    expect(sourceWmts.getUrls()).toEqual([
      'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS?',
    ]);
  });
  test('provide ogc async', async () => {
    const sourceWmts = await WmtsProvider.provideAsync({
      layer: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
      matrixSet: 'PM_0_19',
      url: 'https://data.geopf.fr/annexes/ressources/wmts/essentiels.xml',
    });
    expect(sourceWmts.getLayer()).toEqual('CADASTRALPARCELS.PARCELLAIRE_EXPRESS');
    expect(sourceWmts.getMatrixSet()).toEqual('PM_0_19');
    expect(sourceWmts.getUrls()).toEqual(['https://data.geopf.fr/annexes/ressources/wmts/essentiels.xml?']);
  });
  test('provide ogc async with capabilitiesUrl', async () => {
    const sourceWmts = await WmtsProvider.provideAsync({
      capabilitiesUrl:
        'https://data.geopf.fr/annexes/ressources/wmts/essentiels.xml?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0',
      layer: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
      matrixSet: 'PM_0_19',
      url: 'https://data.geopf.fr/annexes/ressources/wmts/essentiels.xml',
    });
    expect(sourceWmts.getLayer()).toEqual('CADASTRALPARCELS.PARCELLAIRE_EXPRESS');
    expect(sourceWmts.getMatrixSet()).toEqual('PM_0_19');
    expect(sourceWmts.getUrls()).toEqual(['https://data.geopf.fr/annexes/ressources/wmts/essentiels.xml?']);
  });

  test('provide ogc async with proxyfied url', async () => {
    const sourceWmts = await WmtsProvider.provideAsync({
      capabilitiesUrl:
        'https://data.geopf.fr/annexes/ressources/wmts/essentiels.xml?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0',
      layer: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
      matrixSet: 'PM_0_19',
      url: 'https://my-serveur/my-proxy',
      requestEncoding: 'KVP',
    });
    expect(sourceWmts.getLayer()).toEqual('CADASTRALPARCELS.PARCELLAIRE_EXPRESS');
    expect(sourceWmts.getMatrixSet()).toEqual('PM_0_19');
    expect(sourceWmts.getUrls()).toEqual(['https://my-serveur/my-proxy?']);
  });

  test('provide async with proxyfied url', async () => {
    const sourceWmts = await WmtsProvider.provideAsync({
      capabilitiesUrl:
        'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS/1.0.0/WMTSCapabilities.xml',
      layer: 'WorldTimeZones',
      matrixSet: 'GoogleMapsCompatible',
      url: 'https://my-serveur/my-proxy',
      requestEncoding: 'KVP',
    });
    expect(sourceWmts.getLayer()).toEqual('WorldTimeZones');
    expect(sourceWmts.getMatrixSet()).toEqual('GoogleMapsCompatible');
    expect(sourceWmts.getUrls()).toEqual(['https://my-serveur/my-proxy?']);
  });
});
