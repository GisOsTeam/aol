import { IResponse, send } from 'bhreq';
import { WmtsProvider } from '../../source/provider';

describe('aol.wmts', () => {
  test('provide sync', async () => {
    const request = {
      url: `https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS/1.0.0/WMTSCapabilities.xml`,
      method: 'GET',
    };
    const response: IResponse = await send(request);
    const sourceWmts = WmtsProvider.provideSync(response.text, {
      layer: 'WorldTimeZones',
      matrixSet: 'GoogleMapsCompatible',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS',
    });
    expect(sourceWmts.getLayer()).toEqual('WorldTimeZones');
    expect(sourceWmts.getMatrixSet()).toEqual('GoogleMapsCompatible');
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
  });
  test('provide ogc async', async () => {
    const sourceWmts = await WmtsProvider.provideAsync({
      layer: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
      matrixSet: 'PM',
      url: 'https://wxs.ign.fr/beta/geoportail/wmts',
    });
    expect(sourceWmts.getLayer()).toEqual('CADASTRALPARCELS.PARCELLAIRE_EXPRESS');
    expect(sourceWmts.getMatrixSet()).toEqual('PM');
  });
  test('provide ogc async with capabilitiesUrl', async () => {
    const sourceWmts = await WmtsProvider.provideAsync({
      capabilitiesUrl:
        'https://wxs.ign.fr/beta/geoportail/wmts?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0',
      layer: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
      matrixSet: 'PM',
      url: 'https://wxs.ign.fr/beta/geoportail/wmts',
    });
    expect(sourceWmts.getLayer()).toEqual('CADASTRALPARCELS.PARCELLAIRE_EXPRESS');
    expect(sourceWmts.getMatrixSet()).toEqual('PM');
  });
});
