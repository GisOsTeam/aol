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
          Style: [
            { Name: 'normal', LegendURL: [{ OnlineResource: 'https://example.com/legend-normal.png' }] },
            { Name: 'PCI vecteur', LegendURL: [{ OnlineResource: 'https://example.com/legend-pci.png' }] },
          ],
        },
      ],
    },
  },
};

const mockFetchWmsCapabilities = wmsCapabilitiesModule.fetchWmsCapabilities as jest.Mock;

beforeEach(() => {
  mockFetchWmsCapabilities.mockReset().mockResolvedValue(capabilities);
});

describe('changeLayerStyle', () => {
  describe('TileWms', () => {
    test('updates the STYLES param on the source and returns the new legend url', async () => {
      const source = new TileWms({ url: WMS_URL, types: [{ id: LAYER_NAME }], params: {} });
      const onLegendChange = jest.fn();

      const legendUrl = await source.changeLayerStyle(LAYER_NAME, 'PCI vecteur', onLegendChange);

      expect(source.getParams().STYLES).toBe('PCI vecteur');
      expect(legendUrl).toBe('https://example.com/legend-pci.png');
      expect(onLegendChange).toHaveBeenCalledWith(legendUrl, 'PCI vecteur');
      expect(mockFetchWmsCapabilities).toHaveBeenCalledWith(WMS_URL, { version: source.getSourceOptions().version });
    });
  });

  describe('ImageWms', () => {
    test('updates the STYLES param on the source and returns the new legend url', async () => {
      const source = new ImageWms({ url: WMS_URL, types: [{ id: LAYER_NAME }], params: {} });
      const onLegendChange = jest.fn();

      const legendUrl = await source.changeLayerStyle(LAYER_NAME, 'PCI vecteur', onLegendChange);

      expect(source.getParams().STYLES).toBe('PCI vecteur');
      expect(legendUrl).toBe('https://example.com/legend-pci.png');
      expect(onLegendChange).toHaveBeenCalledWith(legendUrl, 'PCI vecteur');
      expect(mockFetchWmsCapabilities).toHaveBeenCalledWith(WMS_URL, { version: source.getSourceOptions().version });
    });
  });
});
