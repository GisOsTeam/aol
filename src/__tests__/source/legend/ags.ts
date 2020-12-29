import { ILayerLegend } from '../../../source/IExtended';
import { ImageArcGISRest } from '../../../source/ImageArcGISRest';

const states = new ImageArcGISRest({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  types: [{ id: 2, identifierAttribute: { key: 'objectid' } }],
});

test('fetchLegend ags', async () => {
  const response = await states.fetchLegend();
  expect<string>(response[2][0].srcImage).toEqual(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAADZJREFUOI1jYaAyYKGlgf+pYB4jugsZKTDsPwMDjb08auCogaMGjhqI00BKykRGdAMpKQvhAABd0QNSDPGCHwAAAABJRU5ErkJggg=='
    );
});
