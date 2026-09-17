import { ImageWms } from '../../../source/ImageWms';
import { HttpEngine, IHttpResponse } from '../../../HttpEngine';
import { clearWmsCapabilitiesCache } from '../../../utils/wms-capabilities';

const WMS_URL = 'https://data.geopf.fr/wms-r/wms';
const LAYER_NAME = 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS';

describe('loadLegendWms fallback (real network, data.geopf.fr)', () => {
  const states = new ImageWms({
    url: WMS_URL,
    types: [{ id: LAYER_NAME }],
    params: {},
  });

  test('LLW2 - falls back to the static LegendURL when GetLegendGraphic fails (real IGN server)', async () => {
    // Le serveur WMS-r Géoplateforme de l'IGN ne supporte pas GetLegendGraphic : on doit
    // retomber sur la LegendURL statique du premier style ("normal") déclarée dans le GetCapabilities.
    const response = await states.fetchLegend();
    expect<string>(response[LAYER_NAME][0].srcImage).toContain(
      'https://data.geopf.fr/annexes/ressources/legendes/CADASTRALPARCELS.PARCELLAIRE_EXPRESS-legend.png',
    );
  });
});

// Les tests ci-dessous mockent HttpEngine pour couvrir déterministiquement, sans dépendre du
// réseau ni du serveur IGN, les branches LLW2/LLW3 de loadLegendWms (cf.
// wms-capabilities.branches.md). `loadImagesWithHttpEngine: true` fait passer la requête
// GetLegendGraphic elle-même par HttpEngine (responseType 'blob'), ce qui permet de simuler
// instantanément son échec au lieu d'attendre le timeout jsdom sur une vraie <img>.
describe('loadLegendWms fallback (mocked HttpEngine)', () => {
  let sendSpy: jest.SpyInstance;

  const CAPABILITIES_WITH_LEGEND = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Test</Title></Service>
  <Capability>
    <Layer>
      <Layer>
        <Name>${LAYER_NAME}</Name>
        <Style>
          <Name>normal</Name>
          <LegendURL width="300" height="69">
            <Format>image/png</Format>
            <OnlineResource xlink:href="https://example.com/legend.png" xlink:type="simple"/>
          </LegendURL>
        </Style>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

  const CAPABILITIES_WITH_TWO_STYLES = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Test</Title></Service>
  <Capability>
    <Layer>
      <Layer>
        <Name>${LAYER_NAME}</Name>
        <Style>
          <Name>normal</Name>
          <LegendURL width="300" height="69">
            <Format>image/png</Format>
            <OnlineResource xlink:href="https://example.com/legend-normal.png" xlink:type="simple"/>
          </LegendURL>
        </Style>
        <Style>
          <Name>PCI vecteur</Name>
          <LegendURL width="300" height="183">
            <Format>image/png</Format>
            <OnlineResource xlink:href="https://example.com/legend-pci.png" xlink:type="simple"/>
          </LegendURL>
        </Style>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

  const CAPABILITIES_WITHOUT_LEGEND = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
  <Service><Name>WMS</Name><Title>Test</Title></Service>
  <Capability>
    <Layer>
      <Layer>
        <Name>${LAYER_NAME}</Name>
        <Style>
          <Name>normal</Name>
        </Style>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

  function mockHttpEngine(capabilitiesXml: string) {
    sendSpy = jest.spyOn(HttpEngine.getInstance(), 'send').mockImplementation((request: any) => {
      if (request.responseType === 'blob') {
        // Requête de l'image GetLegendGraphic : simule un serveur qui ne supporte pas l'opération.
        return Promise.reject(new Error('GetLegendGraphic not supported'));
      }
      return Promise.resolve({
        status: 200,
        text: capabilitiesXml,
        body: null,
        statusText: 'OK',
        contentType: 'text/xml',
        responseType: 'text',
        headers: {},
      } as IHttpResponse);
    });
  }

  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    clearWmsCapabilitiesCache();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    sendSpy.mockRestore();
    warnSpy.mockRestore();
  });

  test('LLW2 - falls back to the static LegendURL when GetLegendGraphic fails', async () => {
    mockHttpEngine(CAPABILITIES_WITH_LEGEND);
    const source = new ImageWms({
      url: WMS_URL,
      types: [{ id: LAYER_NAME }],
      params: {},
      loadImagesWithHttpEngine: true,
    });

    const response = await source.fetchLegend();
    expect(response[LAYER_NAME][0].srcImage).toBe('https://example.com/legend.png');
  });

  test('LLW3 - throws when no static LegendURL is found either', async () => {
    mockHttpEngine(CAPABILITIES_WITHOUT_LEGEND);
    const source = new ImageWms({
      url: WMS_URL,
      types: [{ id: LAYER_NAME }],
      params: {},
      loadImagesWithHttpEngine: true,
    });

    await expect(source.fetchLegend()).rejects.toThrow(/Unable to load legend for WMS layer/);
  });

  test('LLW4 - memoizes a GetLegendGraphic failure: a later call skips straight to the fallback', async () => {
    mockHttpEngine(CAPABILITIES_WITH_LEGEND);
    const source = new ImageWms({
      url: WMS_URL,
      types: [{ id: LAYER_NAME }],
      params: {},
      loadImagesWithHttpEngine: true,
    });
    const countBlobCalls = () => sendSpy.mock.calls.filter((call) => call[0].responseType === 'blob').length;

    await source.fetchLegend();
    expect(countBlobCalls()).toBe(1);

    await source.fetchLegend({ refresh: true });
    expect(countBlobCalls()).toBe(1); // no new GetLegendGraphic attempt on the second call
  });

  test('LLW5 - fallback legend follows the currently active STYLES param, not just the first style', async () => {
    mockHttpEngine(CAPABILITIES_WITH_TWO_STYLES);
    const source = new ImageWms({
      url: WMS_URL,
      types: [{ id: LAYER_NAME }],
      params: {},
      loadImagesWithHttpEngine: true,
    });
    source.updateParams({ ...source.getParams(), STYLES: 'PCI vecteur' });

    const response = await source.fetchLegend();
    expect(response[LAYER_NAME][0].srcImage).toBe('https://example.com/legend-pci.png');
  });
});
