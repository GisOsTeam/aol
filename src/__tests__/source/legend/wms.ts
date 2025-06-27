import { ImageWms } from '../../../source/ImageWms';

const states = new ImageWms({
  url: 'https://data.geopf.fr/wms-r/wms',
  types: [{ id: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS' }],
  params: {},
});

test('fetchLegend wms', async () => {
  const response = await states.fetchLegend();
  expect<string>(response['CADASTRALPARCELS.PARCELLAIRE_EXPRESS'][0].srcImage).toContain(
    'https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
  );
});
