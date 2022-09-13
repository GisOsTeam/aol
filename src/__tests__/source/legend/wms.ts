import { ImageWms } from '../../../source/ImageWms';

const states = new ImageWms({
  url: 'https://ahocevar.com/geoserver/wms',
  types: [{ id: 'topp:states' }],
  params: {},
});

test('fetchLegend wms', async () => {
  const response = await states.fetchLegend();
  expect<string>(response['topp:states'][0].srcImage).toEqual(
    'https://ahocevar.com/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=topp%3Astates&TRANSPARENT=true&SLD_VERSION=1.1.0'
  );
});
