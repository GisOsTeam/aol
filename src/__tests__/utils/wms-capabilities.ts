import { HttpEngine, IHttpResponse } from '../../HttpEngine';
import {
  clearWmsCapabilitiesCache,
  fetchWmsCapabilities,
  getWmsLayerStyles,
  getWmsLegendUrl,
} from '../../utils/wms-capabilities';

const WMS_URL = 'https://data.geopf.fr/wms-r/wms';

const CAPABILITIES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service>
    <Name>WMS</Name>
    <Title>Test WMS</Title>
  </Service>
  <Capability>
    <Layer>
      <Title>Root</Title>
      <Layer>
        <Title>Group</Title>
        <Layer queryable="1">
          <Name>CADASTRALPARCELS.PARCELLAIRE_EXPRESS</Name>
          <Title>Parcellaire Express (PCI)</Title>
          <Style>
            <Name>normal</Name>
            <Title>normal</Title>
            <LegendURL width="300" height="69">
              <Format>image/png</Format>
              <OnlineResource xlink:href="https://data.geopf.fr/annexes/ressources/legendes/CADASTRALPARCELS.PARCELLAIRE_EXPRESS-legend.png" xlink:type="simple"/>
            </LegendURL>
          </Style>
          <Style>
            <Name>PCI vecteur</Name>
            <Title>PCI vecteur</Title>
            <LegendURL width="300" height="183">
              <Format>image/png</Format>
              <OnlineResource xlink:href="https://data.geopf.fr/annexes/ressources/legendes/CADASTRALPARCELS.PARCELLAIRE_EXPRESS.png" xlink:type="simple"/>
            </LegendURL>
          </Style>
        </Layer>
      </Layer>
      <Layer>
        <Name>NOLEGEND.LAYER</Name>
        <Title>No legend declared</Title>
        <Style>
          <Name>default</Name>
          <Title>default</Title>
        </Style>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;

function mockCapabilitiesResponse(sendSpy: jest.SpyInstance, xml = CAPABILITIES_XML) {
  sendSpy.mockResolvedValue({
    status: 200,
    text: xml,
    body: null,
    statusText: 'OK',
    contentType: 'text/xml',
    responseType: 'text',
    headers: {},
  } as IHttpResponse);
}

describe('aol.source.legend.wms-capabilities', () => {
  let sendSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    clearWmsCapabilitiesCache();
    sendSpy = jest.spyOn(HttpEngine.getInstance(), 'send');
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    sendSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe('fetchWmsCapabilities', () => {
    test('C1 - parses the GetCapabilities response into a Capability.Layer tree', async () => {
      mockCapabilitiesResponse(sendSpy);
      const capabilities = await fetchWmsCapabilities(WMS_URL);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(capabilities.Capability.Layer).toBeDefined();
    });

    test('C2 - sends SERVICE/REQUEST/VERSION params, defaulting VERSION to 1.3.0', async () => {
      mockCapabilitiesResponse(sendSpy);
      await fetchWmsCapabilities(WMS_URL);
      expect(sendSpy.mock.calls[0][0]).toMatchObject({
        url: WMS_URL,
        params: { SERVICE: 'WMS', REQUEST: 'GetCapabilities', VERSION: '1.3.0' },
      });
    });

    test('C3 - caches the result: a second call for the same url does not hit HttpEngine again', async () => {
      mockCapabilitiesResponse(sendSpy);
      const first = await fetchWmsCapabilities(WMS_URL);
      const second = await fetchWmsCapabilities(WMS_URL);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(second).toBe(first);
    });

    test('C4 - refresh=true bypasses the cache and re-fetches', async () => {
      mockCapabilitiesResponse(sendSpy);
      await fetchWmsCapabilities(WMS_URL);
      await fetchWmsCapabilities(WMS_URL, { refresh: true });
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    test('C5 - a different version is cached separately from the default version', async () => {
      mockCapabilitiesResponse(sendSpy);
      await fetchWmsCapabilities(WMS_URL);
      await fetchWmsCapabilities(WMS_URL, { version: '1.1.0' as any });
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    test('C6 - a failed request is not cached: a retry hits HttpEngine again', async () => {
      sendSpy.mockRejectedValueOnce(new Error('network error'));
      await expect(fetchWmsCapabilities(WMS_URL)).rejects.toThrow('network error');
      mockCapabilitiesResponse(sendSpy);
      await expect(fetchWmsCapabilities(WMS_URL)).resolves.toBeDefined();
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    test('C7 - an unparsable response throws instead of caching', async () => {
      mockCapabilitiesResponse(sendSpy, '<not-wms/>');
      await expect(fetchWmsCapabilities(WMS_URL)).rejects.toThrow(/Unable to parse WMS capabilities/);
    });
  });

  describe('getWmsLayerStyles', () => {
    test('S1 - returns the style names of a nested layer', async () => {
      mockCapabilitiesResponse(sendSpy);
      const capabilities = await fetchWmsCapabilities(WMS_URL);
      expect(getWmsLayerStyles(capabilities, 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS')).toEqual([
        'normal',
        'PCI vecteur',
      ]);
    });

    test('S2 - returns an empty array for an unknown layer', async () => {
      mockCapabilitiesResponse(sendSpy);
      const capabilities = await fetchWmsCapabilities(WMS_URL);
      expect(getWmsLayerStyles(capabilities, 'UNKNOWN.LAYER')).toEqual([]);
    });
  });

  describe('getWmsLegendUrl', () => {
    test('L1 - styleName omitted → returns the first declared style LegendURL', async () => {
      mockCapabilitiesResponse(sendSpy);
      const capabilities = await fetchWmsCapabilities(WMS_URL);
      expect(getWmsLegendUrl(capabilities, 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS')).toBe(
        'https://data.geopf.fr/annexes/ressources/legendes/CADASTRALPARCELS.PARCELLAIRE_EXPRESS-legend.png',
      );
    });

    test('L2 - styleName provided → returns that style LegendURL', async () => {
      mockCapabilitiesResponse(sendSpy);
      const capabilities = await fetchWmsCapabilities(WMS_URL);
      expect(getWmsLegendUrl(capabilities, 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS', 'PCI vecteur')).toBe(
        'https://data.geopf.fr/annexes/ressources/legendes/CADASTRALPARCELS.PARCELLAIRE_EXPRESS.png',
      );
    });

    test('L3 - unknown layer → null + console.warn', async () => {
      mockCapabilitiesResponse(sendSpy);
      const capabilities = await fetchWmsCapabilities(WMS_URL);
      expect(getWmsLegendUrl(capabilities, 'UNKNOWN.LAYER')).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    test('L4 - unknown style name → null + console.warn listing available styles', async () => {
      mockCapabilitiesResponse(sendSpy);
      const capabilities = await fetchWmsCapabilities(WMS_URL);
      expect(getWmsLegendUrl(capabilities, 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS', 'unknown-style')).toBeNull();
      expect(warnSpy.mock.calls[0][0]).toContain('normal, PCI vecteur');
    });

    test('L5 - style exists but declares no LegendURL → null + console.warn', async () => {
      mockCapabilitiesResponse(sendSpy);
      const capabilities = await fetchWmsCapabilities(WMS_URL);
      expect(getWmsLegendUrl(capabilities, 'NOLEGEND.LAYER')).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('clearWmsCapabilitiesCache', () => {
    test('CC1 - no argument → clears every cached entry', async () => {
      mockCapabilitiesResponse(sendSpy);
      await fetchWmsCapabilities(WMS_URL);
      await fetchWmsCapabilities('https://other-server.example/wms');

      clearWmsCapabilitiesCache();

      await fetchWmsCapabilities(WMS_URL);
      await fetchWmsCapabilities('https://other-server.example/wms');
      expect(sendSpy).toHaveBeenCalledTimes(4);
    });

    test('CC2 - wmsUrl provided → clears only that entry, others stay cached', async () => {
      mockCapabilitiesResponse(sendSpy);
      await fetchWmsCapabilities(WMS_URL);
      await fetchWmsCapabilities('https://other-server.example/wms');

      clearWmsCapabilitiesCache(WMS_URL);

      await fetchWmsCapabilities(WMS_URL); // re-fetched
      await fetchWmsCapabilities('https://other-server.example/wms'); // still cached
      expect(sendSpy).toHaveBeenCalledTimes(3);
    });
  });
});
