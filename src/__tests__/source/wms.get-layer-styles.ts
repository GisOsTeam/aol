import { ImageWms, TileWms } from '../../source';
import { IWmsCapabilities } from '../../utils/wms-capabilities';
import * as wmsCapabilitiesModule from '../../utils/wms-capabilities';

jest.mock('../../utils/wms-capabilities', () => ({
  ...jest.requireActual('../../utils/wms-capabilities'),
  fetchWmsCapabilities: jest.fn(),
}));

const WMS_URL = 'https://data.geopf.fr/wms-r/wms';
const LAYER_NAME = 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS';

const capabilities: IWmsCapabilities = {
  version: '1.3.0',
  Capability: {
    Layer: {
      Layer: [
        {
          Name: LAYER_NAME,
          Style: [{ Name: 'normal' }, { Name: 'PCI vecteur' }],
        },
      ],
    },
  },
};

const mockFetchWmsCapabilities = wmsCapabilitiesModule.fetchWmsCapabilities as jest.Mock;

beforeEach(() => {
  mockFetchWmsCapabilities.mockReset().mockResolvedValue(capabilities);
});

describe('getLayerStyles', () => {
  describe('TileWms', () => {
    test('returns the style names declared for the layer', async () => {
      const source = new TileWms({ url: WMS_URL, types: [{ id: LAYER_NAME }], params: {} });

      const styles = await source.getLayerStyles(LAYER_NAME);

      expect(styles).toEqual(['normal', 'PCI vecteur']);
      expect(mockFetchWmsCapabilities).toHaveBeenCalledWith(WMS_URL, { version: source.getSourceOptions().version });
    });
  });

  describe('ImageWms', () => {
    test('returns the style names declared for the layer', async () => {
      const source = new ImageWms({ url: WMS_URL, types: [{ id: LAYER_NAME }], params: {} });

      const styles = await source.getLayerStyles(LAYER_NAME);

      expect(styles).toEqual(['normal', 'PCI vecteur']);
      expect(mockFetchWmsCapabilities).toHaveBeenCalledWith(WMS_URL, { version: source.getSourceOptions().version });
    });
  });
});
