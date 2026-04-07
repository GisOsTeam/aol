import {
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_PROJECTION_CODE,
  WFSLoadDescription,
  WfsVersionEnum,
} from '../../../source/common/wfs';
import { HttpEngine, IHttpEngine } from '../../../HttpEngine';
import { IFeatureType } from '../../../source/IExtended';
import * as wfsQuery from '../../../source/query/wfs';

jest.mock('../../../HttpEngine');

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

  it('devrait charger la description WFS depuis le XSD et mettre à jour le type avec attributes parsés', async () => {
    // Arrange
    const type: IFeatureType<string> = {
      id: 'lyv_lyvia.lyvhistoriqueType', // Must match complexType name in XSD
      name: 'lyvhistorique',
    };

    const options = {
      url: 'http://example.com/wfs',
      version: WfsVersionEnum.V2_0_0,
      type: type,
      outputFormat: DEFAULT_OUTPUT_FORMAT,
      requestProjectionCode: DEFAULT_PROJECTION_CODE,
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

  test("devrait mettre à jour le type si DescribeFeatureType n'est pas supporté mais loadWfsFeatureDescription réussit", async () => {
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

  test("devrait ne pas mettre à jour le type si DescribeFeatureType n'est pas supporté et loadWfsFeatureDescription échoue", async () => {
    // Arrange
    const type: IFeatureType<string> = {
      id: 'lyv_lyvia.lyvhistoriqueType',
      name: 'lyvhistorique',
    };

    const options = {
      url: 'http://example.com/wfs',
      version: WfsVersionEnum.V2_0_0,
      type: type,
      outputFormat: DEFAULT_OUTPUT_FORMAT,
      requestProjectionCode: DEFAULT_PROJECTION_CODE,
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
});
