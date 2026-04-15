import {
  DEFAULT_WFS_OUTPUT_FORMAT,
  DEFAULT_WFS_PROJECTION_CODE,
  DEFAULT_WFS_LIMIT,
  DEFAULT_WFS_VERSION,
  DEFAULT_WFS_OPTIONS,
  WFSInit,
  WFSLoadDescription,
  WFSMergeOptions,
  WFSInitializeOptions,
  WFSQuery,
  WFSRetrieveFeature,
  WfsVersionEnum,
  ICommonWfsOptions,
} from '../../../source/common/wfs';
import { HttpEngine, IHttpEngine } from '../../../HttpEngine';
import { IFeatureType, IGisRequest, IQueryFeatureTypeResponse, IQuerySource } from '../../../source/IExtended';
import { Feature } from 'ol';
import OlMap from 'ol/Map';
import Projection from 'ol/proj/Projection';
import * as wfsQuery from '../../../source/query/wfs';

jest.mock('../../../HttpEngine');
describe('aol.source.common.wfs', () => {
  describe('WFSMergeOptions', () => {
    test('M1 - newOptions écrase oldOptions sur les propriétés communes', () => {
      const oldOptions: Partial<ICommonWfsOptions> = {
        url: 'http://new.com/wfs',
        version: WfsVersionEnum.V2_0_0,
        limit: 5000,
      };

      const newOptions: Partial<ICommonWfsOptions> = {
        url: 'http://old.com/wfs',
        type: { id: 'test:layer' },
        outputFormat: 'application/json',
      };

      const result = WFSMergeOptions<ICommonWfsOptions>(oldOptions, newOptions);

      // newOptions should override oldOptions (M1)
      expect(result.url).toBe('http://old.com/wfs');
      expect(result.outputFormat).toBe('application/json');
    });

    test('M2 - oldOptions vides → seules les newOptions contribuent', () => {
      const oldOptions: Partial<ICommonWfsOptions> = {};
      const newOptions: Partial<ICommonWfsOptions> = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
      };

      const result = WFSMergeOptions<ICommonWfsOptions>(oldOptions, newOptions);
      expect(result.url).toBe('http://example.com/wfs');
      expect(result.type).toEqual({ id: 'test:layer' });
    });

    test('M3 - newOptions vides → seules les oldOptions contribuent', () => {
      const oldOptions: Partial<ICommonWfsOptions> = {
        url: 'http://example.com/wfs',
        version: WfsVersionEnum.V1_1_0,
      };
      const newOptions: Partial<ICommonWfsOptions> = {};

      const result = WFSMergeOptions<ICommonWfsOptions>(oldOptions, newOptions);
      expect(result.url).toBe('http://example.com/wfs');
      expect(result.version).toBe(WfsVersionEnum.V1_1_0);
    });

    test('M4 - propriétés non-chevauchantes des deux objets sont préservées', () => {
      const oldOptions: Partial<ICommonWfsOptions> = {
        version: WfsVersionEnum.V2_0_0,
        outputFormat: DEFAULT_WFS_OUTPUT_FORMAT,
        requestProjectionCode: DEFAULT_WFS_PROJECTION_CODE,
        swapXYBBOXRequest: true,
        swapLonLatGeometryResult: false,
        limit: DEFAULT_WFS_LIMIT,
      };

      const newOptions: Partial<ICommonWfsOptions> = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
      };

      const result = WFSMergeOptions<ICommonWfsOptions>(oldOptions, newOptions);
      expect(result.url).toBe('http://example.com/wfs');
      expect(result.type).toEqual({ id: 'test:layer' });
      expect(result.version).toBe(WfsVersionEnum.V2_0_0);
      expect(result.outputFormat).toBe(DEFAULT_WFS_OUTPUT_FORMAT);
      expect(result.requestProjectionCode).toBe(DEFAULT_WFS_PROJECTION_CODE);
      expect(result.swapXYBBOXRequest).toBe(true);
      expect(result.swapLonLatGeometryResult).toBe(false);
      expect(result.limit).toBe(DEFAULT_WFS_LIMIT);
    });
  });

  describe('WFSInitializeOptions', () => {
    test('I7 - fusion avec les options par défaut', () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);

      expect(result.url).toBe('http://example.com/wfs');
      expect(result.type).toEqual({ id: 'test:layer' });
      expect(result.version).toBe(DEFAULT_WFS_VERSION);
      expect(result.outputFormat).toBe(DEFAULT_WFS_OUTPUT_FORMAT);
      expect(result.requestProjectionCode).toBe(DEFAULT_WFS_PROJECTION_CODE);
      expect(result.swapXYBBOXRequest).toBe(false);
      expect(result.swapLonLatGeometryResult).toBe(false);
      expect(result.limit).toBe(DEFAULT_WFS_LIMIT);
    });

    test('I1 - snapshotable non défini → positionné à true', () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);
      expect(result.snapshotable).toBe(true);
    });

    test('I3 - listable non défini → positionné à true', () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);
      expect(result.listable).toBe(true);
    });

    test('I5 - removable non défini → positionné à true', () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);
      expect(result.removable).toBe(true);
    });

    test('I2 - snapshotable = false → conservé à false', () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
        snapshotable: false,
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);
      expect(result.snapshotable).toBe(false);
    });

    test('I4 - listable = false → conservé à false', () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
        listable: false,
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);
      expect(result.listable).toBe(false);
    });

    test('I6 - removable = false → conservé à false', () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
        removable: false,
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);
      expect(result.removable).toBe(false);
    });

    test('I8 - options personnalisées écrasent les defaults', () => {
      const options: ICommonWfsOptions = {
        url: 'http://custom.com/wfs',
        type: { id: 'custom:layer' },
        limit: 500,
        version: WfsVersionEnum.V1_0_0,
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);
      // Custom values override defaults (I8)
      expect(result.url).toBe('http://custom.com/wfs');
      expect(result.type).toEqual({ id: 'custom:layer' });
      expect(result.limit).toBe(500);
      expect(result.version).toBe(WfsVersionEnum.V1_0_0);
    });

    test('I9 - mélange de flags (snapshotable=true, listable=false, removable=true)', () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
        snapshotable: true,
        listable: false,
        removable: true,
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);
      expect(result.snapshotable).toBe(true);
      expect(result.listable).toBe(false);
      expect(result.removable).toBe(true);
    });

    test('I10 - swapXYBBOXRequest et swapLonLatGeometryResult à true sont préservés', () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
        outputFormat: 'application/json',
        requestProjectionCode: 'EPSG:4326',
        swapXYBBOXRequest: true,
        swapLonLatGeometryResult: true,
      };

      const result = WFSInitializeOptions<ICommonWfsOptions>(options);
      expect(result.outputFormat).toBe('application/json');
      expect(result.requestProjectionCode).toBe('EPSG:4326');
      expect(result.swapXYBBOXRequest).toBe(true);
      expect(result.swapLonLatGeometryResult).toBe(true);
    });
  });

  describe('WFSLoadDescription', () => {
    let mockSend: jest.Mock;
    let mockHttpEngineInstance: IHttpEngine;
    let mockLoadDescribeFeatureType: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();

      mockSend = jest.fn();
      mockHttpEngineInstance = {
        send: mockSend,
      };

      (HttpEngine.getInstance as jest.Mock).mockReturnValue(mockHttpEngineInstance);
      mockLoadDescribeFeatureType = jest.spyOn(wfsQuery, 'loadDescribeFeatureType');
    });

    test('LD1 - loadDescribeFeatureType retourne true → description chargée depuis XSD', async () => {
      // Arrange
      const type: IFeatureType<string> = {
        id: 'lyv_lyvia.lyvhistoriqueType', // Must match complexType name in XSD
        name: 'lyvhistorique',
      };

      const options = {
        url: 'http://example.com/wfs',
        version: WfsVersionEnum.V2_0_0,
        type: type,
        outputFormat: DEFAULT_WFS_OUTPUT_FORMAT,
        requestProjectionCode: DEFAULT_WFS_PROJECTION_CODE,
        swapXYBBOXRequest: false,
        swapLonLatGeometryResult: false,
      };

      // XSD avec namespace correct
      mockSend.mockResolvedValue({
        status: 200,
        text: `<?xml version="1.0" encoding="UTF-8"?><xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:metropole-de-lyon="http://metropole-de-lyon" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://metropole-de-lyon">
  <xsd:import namespace="http://www.opengis.net/gml/3.2" schemaLocation="https://data.grandlyon.com/geoserver/schemas/gml/3.2.1/gml.xsd"/>
  <xsd:complexType name="lyv_lyvia.lyvhistoriqueType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element maxOccurs="1" minOccurs="0" name="numero" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="intervenant" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="nature_chantier" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="nature_travaux" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="etat" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="date_debut" nillable="true" type="xsd:date"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="date_fin" nillable="true" type="xsd:date"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="mesures_police" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="last_update" nillable="true" type="xsd:dateTime"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="adresse" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="commune" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="code_insee" nillable="true" type="xsd:int"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="contact_tel" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="contact_mail" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="contact_url" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="gid" nillable="true" type="xsd:int"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="the_geom" nillable="true" type="gml:MultiSurfacePropertyType"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="lyv_lyvia.lyvhistorique" substitutionGroup="gml:AbstractFeature" type="metropole-de-lyon:lyv_lyvia.lyvhistoriqueType"/>
</xsd:schema>
`,
      });

      // Act
      await WFSLoadDescription(options);

      // Assert
      expect(mockSend).toHaveBeenCalled();
      const callArgs = mockSend.mock.calls[0][0] as any;
      expect(callArgs.method).toBe('GET');
      expect(callArgs.url).toBe('http://example.com/wfs');
      expect(callArgs.params.typeNames).toBe('lyv_lyvia.lyvhistoriqueType');
      expect(callArgs.params.service).toBe('WFS');
      expect(callArgs.params.version).toBe(WfsVersionEnum.V2_0_0);
      expect(callArgs.params.request).toBe('DescribeFeatureType');

      expect(options.type).toHaveProperty('attributes');
      expect(options.type.attributes).toBeDefined();
      expect((options.type.attributes || []).length).toBe(17);
      expect(options.type.geometryAttribute).toBeDefined();
      expect(options.type.geometryAttribute?.key).toBe('the_geom');
    });

    test('LD2 - loadDescribeFeatureType retourne false → fallback sur loadWfsFeatureDescription', async () => {
      // Arrange
      const type: IFeatureType<string> = {
        id: 'lyv_lyvia.lyvhistoriqueType',
        name: 'lyvhistorique',
      };

      const options = {
        url: 'http://example.com/wfs',
        version: WfsVersionEnum.V1_1_0,
        type: type,
        outputFormat: 'application/json',
        requestProjectionCode: 'EPSG:3857',
        swapXYBBOXRequest: false,
        swapLonLatGeometryResult: false,
      };

      mockLoadDescribeFeatureType.mockResolvedValue(false);

      mockSend.mockResolvedValue({
        status: 200,
        text: `{"type":"FeatureCollection","features":[{"type":"Feature","id":"lyv_lyvia.lyvhistorique.137452","geometry":{"type":"MultiPolygon","coordinates":[[[[549512.36280464,5732284.53289855],[549512.26673104,5732283.55744694],[549511.9822023,5732282.61948139],[549511.5201527,5732281.75504739],[549510.89833854,5732280.99736464],[549510.1406558,5732280.37555049],[549509.2762218,5732279.91350089],[549508.33825625,5732279.62897215],[549507.36280464,5732279.53289855],[549506.38735303,5732279.62897215],[549505.44938748,5732279.91350089],[549504.58495347,5732280.37555049],[549503.82727073,5732280.99736464],[549503.20545658,5732281.75504739],[549502.74340698,5732282.61948139],[549502.45887824,5732283.55744694],[549502.36280464,5732284.53289855],[549502.45887824,5732285.50835017],[549502.74340698,5732286.44631572],[549503.20545658,5732287.31074973],[549503.82727073,5732288.06843246],[549504.58495347,5732288.69024661],[549505.44938748,5732289.15229622],[549506.38735303,5732289.43682496],[549507.36280464,5732289.53289855],[549508.33825625,5732289.43682495],[549509.2762218,5732289.15229622],[549510.1406558,5732288.69024661],[549510.89833854,5732288.06843246],[549511.5201527,5732287.31074972],[549511.9822023,5732286.44631572],[549512.26673104,5732285.50835017],[549512.36280464,5732284.53289855]]]]},"properties":{"numero":"202213382","intervenant":"VVN / VMU / Patrimoine","nature_chantier":"Carrefours","nature_travaux":"Entretien carrefour (giratoire, feux, ...)","etat":"Réfectionné","date_debut":"2022-10-26","date_fin":"2022-10-26","mesures_police":"","last_update":"2023-02-16T18:06:35.191+01:00","adresse":"Rue Alfred de Vigny","commune":"Saint Priest","code_insee":69290,"contact_tel":null,"contact_mail":null,"contact_url":"https://www.grandlyon.com/pratique/nous-contacter","gid":137452},"bbox":[549502.36280464,5732279.53289855,549512.36280464,5732289.53289855]}],"totalFeatures":151114,"numberMatched":151114,"numberReturned":1,"timeStamp":"2026-04-07T08:08:18.982Z","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::3857"}},"bbox":[549502.36280464,5732279.53289855,549512.36280464,5732289.53289855]}`,
      });

      // Act
      await WFSLoadDescription(options);

      // Assert
      expect(mockSend).toHaveBeenCalled();
      expect(options.type).toHaveProperty('id');
      expect(options.type.id).toBe('lyv_lyvia.lyvhistoriqueType');
      expect(options.type).toHaveProperty('name');
      expect(options.type.name).toBe('lyvhistorique');
      expect(options.type).toHaveProperty('attributes');
      expect(options.type.attributes).toBeDefined();
      expect(options.type.geometryAttribute).toBeDefined();
      expect(options.type.geometryAttribute?.key).toBe('geometry');
    });

    test('LD3 - loadDescribeFeatureType retourne false et loadWfsFeatureDescription échoue → erreur propagée', async () => {
      // Arrange
      const type: IFeatureType<string> = {
        id: 'lyv_lyvia.lyvhistoriqueType',
        name: 'lyvhistorique',
      };

      const options = {
        url: 'http://example.com/wfs',
        version: WfsVersionEnum.V2_0_0,
        type: type,
        outputFormat: DEFAULT_WFS_OUTPUT_FORMAT,
        requestProjectionCode: DEFAULT_WFS_PROJECTION_CODE,
        swapXYBBOXRequest: false,
        swapLonLatGeometryResult: false,
      };

      mockLoadDescribeFeatureType.mockResolvedValue(false);

      mockSend.mockResolvedValue({
        status: 400,
        text: 'Bad Request',
      });

      // Act
      try {
        await WFSLoadDescription(options);
      } catch (e) {
        // Assert
        expect(mockSend).toHaveBeenCalled();
        expect(options.type).toHaveProperty('id');
        expect(options.type.id).toBe('lyv_lyvia.lyvhistoriqueType');
        expect(options.type).toHaveProperty('name');
        expect(options.type.name).toBe('lyvhistorique');
        expect(options.type).not.toHaveProperty('attributes');
        expect(options.type.geometryAttribute).toBeUndefined();
      }
    });

    test('LD4 - version undefined → uses DEFAULT_WFS_VERSION in internalOptions', async () => {
      const type: IFeatureType<string> = { id: 'test:layer' };
      const options: Omit<ICommonWfsOptions, 'version'> & Partial<Pick<ICommonWfsOptions, 'version'>> = {
        url: 'http://example.com/wfs',
        type,
        outputFormat: DEFAULT_WFS_OUTPUT_FORMAT,
        requestProjectionCode: DEFAULT_WFS_PROJECTION_CODE,
        // version intentionally omitted
      };

      mockLoadDescribeFeatureType.mockResolvedValue(true);

      await WFSLoadDescription(options as ICommonWfsOptions);

      const callArgs = mockLoadDescribeFeatureType.mock.calls[0][0];
      expect(callArgs.version).toBe(DEFAULT_WFS_VERSION);
    });

    test('LD5 - outputFormat undefined → uses DEFAULT_WFS_OUTPUT_FORMAT in internalOptions', async () => {
      const type: IFeatureType<string> = { id: 'test:layer' };
      const options: Omit<ICommonWfsOptions, 'outputFormat'> & Partial<Pick<ICommonWfsOptions, 'outputFormat'>> = {
        url: 'http://example.com/wfs',
        type,
        version: WfsVersionEnum.V2_0_0,
        requestProjectionCode: DEFAULT_WFS_PROJECTION_CODE,
        // outputFormat intentionally omitted
      };

      mockLoadDescribeFeatureType.mockResolvedValue(true);

      await WFSLoadDescription(options as ICommonWfsOptions);

      const callArgs = mockLoadDescribeFeatureType.mock.calls[0][0];
      expect(callArgs.outputFormat).toBe(DEFAULT_WFS_OUTPUT_FORMAT);
    });

    test('LD6 - requestProjectionCode undefined → uses DEFAULT_WFS_PROJECTION_CODE in internalOptions', async () => {
      const type: IFeatureType<string> = { id: 'test:layer' };
      const options: Omit<ICommonWfsOptions, 'requestProjectionCode'> &
        Partial<Pick<ICommonWfsOptions, 'requestProjectionCode'>> = {
        url: 'http://example.com/wfs',
        type,
        version: WfsVersionEnum.V2_0_0,
        outputFormat: DEFAULT_WFS_OUTPUT_FORMAT,
        // requestProjectionCode intentionally omitted
      };

      mockLoadDescribeFeatureType.mockResolvedValue(true);

      await WFSLoadDescription(options as ICommonWfsOptions);

      const callArgs = mockLoadDescribeFeatureType.mock.calls[0][0];
      expect(callArgs.requestProjectionCode).toBe(DEFAULT_WFS_PROJECTION_CODE);
    });

    test('LD7 - all options defined → provided values are passed through', async () => {
      const type: IFeatureType<string> = { id: 'test:layer' };
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type,
        version: WfsVersionEnum.V1_0_0,
        outputFormat: 'application/json',
        requestProjectionCode: 'EPSG:4326',
      };

      mockLoadDescribeFeatureType.mockResolvedValue(true);

      await WFSLoadDescription(options);

      const callArgs = mockLoadDescribeFeatureType.mock.calls[0][0];
      expect(callArgs.version).toBe(WfsVersionEnum.V1_0_0);
      expect(callArgs.outputFormat).toBe('application/json');
      expect(callArgs.requestProjectionCode).toBe('EPSG:4326');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Constants & Enum
  // ──────────────────────────────────────────────────────────────────────────
  describe('Constants and WfsVersionEnum', () => {
    test('E1 - WfsVersionEnum.V1_0_0 equals "1.0.0"', () => {
      expect(WfsVersionEnum.V1_0_0).toBe('1.0.0');
    });

    test('E2 - WfsVersionEnum.V1_1_0 equals "1.1.0"', () => {
      expect(WfsVersionEnum.V1_1_0).toBe('1.1.0');
    });

    test('E3 - WfsVersionEnum.V2_0_0 equals "2.0.0"', () => {
      expect(WfsVersionEnum.V2_0_0).toBe('2.0.0');
    });

    test('C1 - DEFAULT_WFS_VERSION equals WfsVersionEnum.V1_1_0', () => {
      expect(DEFAULT_WFS_VERSION).toBe(WfsVersionEnum.V1_1_0);
    });

    test('C2 - DEFAULT_WFS_OUTPUT_FORMAT equals "text/xml; subtype=gml/3.1.1"', () => {
      expect(DEFAULT_WFS_OUTPUT_FORMAT).toBe('text/xml; subtype=gml/3.1.1');
    });

    test('C3 - DEFAULT_WFS_PROJECTION_CODE equals "EPSG:3857"', () => {
      expect(DEFAULT_WFS_PROJECTION_CODE).toBe('EPSG:3857');
    });

    test('C4 - DEFAULT_WFS_LIMIT equals 1000', () => {
      expect(DEFAULT_WFS_LIMIT).toBe(1000);
    });

    test('C5 - DEFAULT_WFS_OPTIONS contains all default values', () => {
      expect(DEFAULT_WFS_OPTIONS.outputFormat).toBe(DEFAULT_WFS_OUTPUT_FORMAT);
      expect(DEFAULT_WFS_OPTIONS.version).toBe(DEFAULT_WFS_VERSION);
      expect(DEFAULT_WFS_OPTIONS.requestProjectionCode).toBe(DEFAULT_WFS_PROJECTION_CODE);
      expect(DEFAULT_WFS_OPTIONS.swapXYBBOXRequest).toBe(false);
      expect(DEFAULT_WFS_OPTIONS.swapLonLatGeometryResult).toBe(false);
      expect(DEFAULT_WFS_OPTIONS.limit).toBe(DEFAULT_WFS_LIMIT);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WFSInit
  // ──────────────────────────────────────────────────────────────────────────
  describe('WFSInit', () => {
    let mockLoadDescribeFeatureTypeInit: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      mockLoadDescribeFeatureTypeInit = jest
        .spyOn(wfsQuery, 'loadDescribeFeatureType')
        .mockResolvedValue(true);
    });

    afterEach(() => {
      mockLoadDescribeFeatureTypeInit.mockRestore();
    });

    test('IN1 - should delegate to WFSLoadDescription (loadDescribeFeatureType called once with correct options)', async () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
        version: WfsVersionEnum.V2_0_0,
        outputFormat: DEFAULT_WFS_OUTPUT_FORMAT,
        requestProjectionCode: DEFAULT_WFS_PROJECTION_CODE,
      };

      await WFSInit(options);

      expect(mockLoadDescribeFeatureTypeInit).toHaveBeenCalledTimes(1);
      const callArgs = mockLoadDescribeFeatureTypeInit.mock.calls[0][0];
      expect(callArgs.url).toBe(options.url);
      expect(callArgs.type).toBe(options.type);
    });

    test('IN2 - should resolve to undefined (void)', async () => {
      const options: ICommonWfsOptions = {
        url: 'http://example.com/wfs',
        type: { id: 'test:layer' },
      };

      await expect(WFSInit(options)).resolves.toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WFSQuery
  // ──────────────────────────────────────────────────────────────────────────
  describe('WFSQuery', () => {
    let mockExecuteWfsQuery: jest.SpyInstance;

    const mockSource = {} as IQuerySource;
    const mockRequest: IGisRequest = { olMap: {} as OlMap, queryType: 'query' };
    const mockFeatureTypeResponse: IQueryFeatureTypeResponse = {
      type: { id: 'test:layer' },
      features: [],
      source: mockSource,
    };

    const baseOptions: ICommonWfsOptions = {
      url: 'http://example.com/wfs',
      type: { id: 'test:layer' },
      version: WfsVersionEnum.V2_0_0,
      outputFormat: 'application/json',
      requestProjectionCode: 'EPSG:4326',
      swapXYBBOXRequest: true,
      swapLonLatGeometryResult: true,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockExecuteWfsQuery = jest
        .spyOn(wfsQuery, 'executeWfsQuery')
        .mockResolvedValue(mockFeatureTypeResponse);
    });

    afterEach(() => {
      mockExecuteWfsQuery.mockRestore();
    });

    test('Q1 - should call executeWfsQuery with source, url, type and request', async () => {
      await WFSQuery(mockSource, mockRequest, baseOptions);

      expect(mockExecuteWfsQuery).toHaveBeenCalledTimes(1);
      const callArgs = mockExecuteWfsQuery.mock.calls[0][0];
      expect(callArgs.source).toBe(mockSource);
      expect(callArgs.url).toBe(baseOptions.url);
      expect(callArgs.type).toBe(baseOptions.type);
      expect(callArgs.request).toBe(mockRequest);
    });

    test('Q2 - should use provided version', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, version: WfsVersionEnum.V1_0_0 });
      expect(mockExecuteWfsQuery.mock.calls[0][0].version).toBe(WfsVersionEnum.V1_0_0);
    });

    test('Q3 - version undefined → uses DEFAULT_WFS_VERSION', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, version: undefined } as ICommonWfsOptions);
      expect(mockExecuteWfsQuery.mock.calls[0][0].version).toBe(DEFAULT_WFS_VERSION);
    });

    test('Q4 - should use provided outputFormat', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, outputFormat: 'text/xml' });
      expect(mockExecuteWfsQuery.mock.calls[0][0].outputFormat).toBe('text/xml');
    });

    test('Q5 - outputFormat undefined → uses DEFAULT_WFS_OUTPUT_FORMAT', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, outputFormat: undefined } as ICommonWfsOptions);
      expect(mockExecuteWfsQuery.mock.calls[0][0].outputFormat).toBe(DEFAULT_WFS_OUTPUT_FORMAT);
    });

    test('Q6 - should use provided requestProjectionCode', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, requestProjectionCode: 'EPSG:2154' });
      expect(mockExecuteWfsQuery.mock.calls[0][0].requestProjectionCode).toBe('EPSG:2154');
    });

    test('Q7 - requestProjectionCode undefined → uses DEFAULT_WFS_PROJECTION_CODE', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, requestProjectionCode: undefined } as ICommonWfsOptions);
      expect(mockExecuteWfsQuery.mock.calls[0][0].requestProjectionCode).toBe(DEFAULT_WFS_PROJECTION_CODE);
    });

    test('Q8 - should use provided swapXYBBOXRequest = true', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, swapXYBBOXRequest: true });
      expect(mockExecuteWfsQuery.mock.calls[0][0].swapXYBBOXRequest).toBe(true);
    });

    test('Q9 - swapXYBBOXRequest undefined → uses false', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, swapXYBBOXRequest: undefined } as ICommonWfsOptions);
      expect(mockExecuteWfsQuery.mock.calls[0][0].swapXYBBOXRequest).toBe(false);
    });

    test('Q10 - should use provided swapLonLatGeometryResult = true', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, swapLonLatGeometryResult: true });
      expect(mockExecuteWfsQuery.mock.calls[0][0].swapLonLatGeometryResult).toBe(true);
    });

    test('Q11 - swapLonLatGeometryResult undefined → uses false', async () => {
      await WFSQuery(mockSource, mockRequest, { ...baseOptions, swapLonLatGeometryResult: undefined } as ICommonWfsOptions);
      expect(mockExecuteWfsQuery.mock.calls[0][0].swapLonLatGeometryResult).toBe(false);
    });

    test('Q12 - should return { request, featureTypeResponses: [executeWfsQuery result] }', async () => {
      const result = await WFSQuery(mockSource, mockRequest, baseOptions);
      expect(result.request).toBe(mockRequest);
      expect(result.featureTypeResponses).toHaveLength(1);
      expect(result.featureTypeResponses[0]).toBe(mockFeatureTypeResponse);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WFSRetrieveFeature
  // ──────────────────────────────────────────────────────────────────────────
  describe('WFSRetrieveFeature', () => {
    let mockRetrieveWfsFeature: jest.SpyInstance;

    const mockProjection = new Projection({ code: 'EPSG:4326' });
    const mockFeature = new Feature();

    const baseOptions: ICommonWfsOptions = {
      url: 'http://example.com/wfs',
      type: { id: 'test:layer' },
      version: WfsVersionEnum.V2_0_0,
      outputFormat: 'application/json',
      requestProjectionCode: 'EPSG:4326',
      swapXYBBOXRequest: true,
      swapLonLatGeometryResult: true,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockRetrieveWfsFeature = jest
        .spyOn(wfsQuery, 'retrieveWfsFeature')
        .mockResolvedValue(mockFeature);
    });

    afterEach(() => {
      mockRetrieveWfsFeature.mockRestore();
    });

    test('R1 - should call retrieveWfsFeature with url, type, id (number) and featureProjection', async () => {
      await WFSRetrieveFeature(42, mockProjection, baseOptions);

      expect(mockRetrieveWfsFeature).toHaveBeenCalledTimes(1);
      const callArgs = mockRetrieveWfsFeature.mock.calls[0][0];
      expect(callArgs.url).toBe(baseOptions.url);
      expect(callArgs.type).toBe(baseOptions.type);
      expect(callArgs.id).toBe(42);
      expect(callArgs.featureProjection).toBe(mockProjection);
    });

    test('R2 - id as string is passed intact', async () => {
      await WFSRetrieveFeature('feature-abc', mockProjection, baseOptions);
      expect(mockRetrieveWfsFeature.mock.calls[0][0].id).toBe('feature-abc');
    });

    test('R3 - should use provided requestProjectionCode', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, requestProjectionCode: 'EPSG:2154' });
      expect(mockRetrieveWfsFeature.mock.calls[0][0].requestProjectionCode).toBe('EPSG:2154');
    });

    test('R4 - requestProjectionCode undefined → uses DEFAULT_WFS_PROJECTION_CODE', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, requestProjectionCode: undefined } as ICommonWfsOptions);
      expect(mockRetrieveWfsFeature.mock.calls[0][0].requestProjectionCode).toBe(DEFAULT_WFS_PROJECTION_CODE);
    });

    test('R5 - should use provided version', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, version: WfsVersionEnum.V1_0_0 });
      expect(mockRetrieveWfsFeature.mock.calls[0][0].version).toBe(WfsVersionEnum.V1_0_0);
    });

    test('R6 - version undefined → uses DEFAULT_WFS_VERSION', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, version: undefined } as ICommonWfsOptions);
      expect(mockRetrieveWfsFeature.mock.calls[0][0].version).toBe(DEFAULT_WFS_VERSION);
    });

    test('R7 - should use provided outputFormat', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, outputFormat: 'text/xml' });
      expect(mockRetrieveWfsFeature.mock.calls[0][0].outputFormat).toBe('text/xml');
    });

    test('R8 - outputFormat undefined → uses DEFAULT_WFS_OUTPUT_FORMAT', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, outputFormat: undefined } as ICommonWfsOptions);
      expect(mockRetrieveWfsFeature.mock.calls[0][0].outputFormat).toBe(DEFAULT_WFS_OUTPUT_FORMAT);
    });

    test('R9 - should use provided swapXYBBOXRequest = true', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, swapXYBBOXRequest: true });
      expect(mockRetrieveWfsFeature.mock.calls[0][0].swapXYBBOXRequest).toBe(true);
    });

    test('R10 - swapXYBBOXRequest undefined → uses false', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, swapXYBBOXRequest: undefined } as ICommonWfsOptions);
      expect(mockRetrieveWfsFeature.mock.calls[0][0].swapXYBBOXRequest).toBe(false);
    });

    test('R11 - should use provided swapLonLatGeometryResult = true', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, swapLonLatGeometryResult: true });
      expect(mockRetrieveWfsFeature.mock.calls[0][0].swapLonLatGeometryResult).toBe(true);
    });

    test('R12 - swapLonLatGeometryResult undefined → uses false', async () => {
      await WFSRetrieveFeature(1, mockProjection, { ...baseOptions, swapLonLatGeometryResult: undefined } as ICommonWfsOptions);
      expect(mockRetrieveWfsFeature.mock.calls[0][0].swapLonLatGeometryResult).toBe(false);
    });

    test('R13 - should return the Feature when retrieveWfsFeature resolves with one', async () => {
      const result = await WFSRetrieveFeature(1, mockProjection, baseOptions);
      expect(result).toBe(mockFeature);
    });

    test('R14 - should return undefined when retrieveWfsFeature resolves with undefined', async () => {
      mockRetrieveWfsFeature.mockResolvedValue(undefined);
      const result = await WFSRetrieveFeature(1, mockProjection, baseOptions);
      expect(result).toBeUndefined();
    });
  });
});
