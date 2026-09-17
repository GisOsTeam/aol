import { FieldTypeEnum } from '../../../filter/IFilter';
import {
  parseDescribeFeatureType,
  parseDescribeFeatureTypeDetailed,
} from '../../../source/parser/wfs-describe-feature-type.parser';

describe('aol.source.parser.wfs-describe-feature-type', () => {
  test('PDFT1 - substitutionGroup="gml:_Feature" (GML 2 / 3.1) est reconnu au même titre que gml:AbstractFeature', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="name" type="xsd:string"/>
          <xsd:element name="geom" type="gml:LineStringPropertyType"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:_Feature" type="myns:RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('myns:Road');
    expect(result[0].attributes).toHaveLength(2);
    expect(result[0].geometryAttribute?.key).toBe('geom');
  });

  test('PDFT2 - plusieurs feature types dans un même schéma → un seul par élément substitutionGroup, les complexType de propriété sont exclus', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="ContactPropertyType">
    <xsd:sequence>
      <xsd:element name="email" type="xsd:string"/>
      <xsd:element name="phone" type="xsd:string"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="name" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:complexType name="BuildingType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="height" type="xsd:double"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature" type="myns:RoadType"/>
  <xsd:element name="Building" substitutionGroup="gml:AbstractFeature" type="myns:BuildingType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    // 3 complexType dans le schéma, mais seulement 2 vrais feature types (ContactPropertyType est un type de propriété)
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id)).toEqual(['myns:Road', 'myns:Building']);
    expect(result.find((f) => f.id === 'myns:Road')?.attributes).toHaveLength(1);
    expect(result.find((f) => f.id === 'myns:Building')?.attributes).toHaveLength(1);
  });

  test('PDFT3 - targetNamespace sans préfixe nommé (xmlns par défaut uniquement) → fallback sur le nom local seul', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns="http://example.com/myns" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="name" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature" type="RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('Road'); // pas de préfixe disponible pour targetNamespace
  });

  test('PDFT4 - schéma non conforme (aucun élément substitutionGroup=gml:AbstractFeature/_Feature) → fallback sur le nom du complexType', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/legacy">
  <xsd:complexType name="LegacyFeatureType">
    <xsd:sequence>
      <xsd:element name="label" type="xsd:string"/>
    </xsd:sequence>
  </xsd:complexType>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('LegacyFeatureType');
    expect(result[0].attributes).toHaveLength(1);
  });

  test('PDFT5 - référence de type pendante (type introuvable dans le schéma) → attributs vides, pas de crash', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:element name="Ghost" substitutionGroup="gml:AbstractFeature" type="myns:GhostType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('myns:Ghost');
    expect(result[0].attributes).toEqual([]);
    expect(result[0].geometryAttribute).toBeUndefined();
    expect(result[0].identifierAttribute).toBeUndefined();
  });

  test('PDFT6 - élément substitutionGroup=gml:AbstractFeature sans attribut name → id/name replient sur Unknown_<idx>', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="name" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element substitutionGroup="gml:AbstractFeature" type="myns:RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('Unknown_0');
    expect(result[0].name).toBe('Unknown');
    // Le complexType reste résolu via l'attribut type de l'élément, indépendamment de son name manquant
    expect(result[0].attributes).toHaveLength(1);
  });

  test('PDFT7 - élément substitutionGroup=gml:AbstractFeature sans attribut type → complexType non résolu, attributs vides', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="name" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('myns:Road');
    expect(result[0].attributes).toEqual([]);
  });

  test('BQN1 - schéma sans attribut targetNamespace → aucune reconstruction de QName, nom local utilisé tel quel', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="name" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature" type="myns:RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('Road');
  });

  test('PE1 - minOccurs, maxOccurs et nillable sont correctement extraits (via parseDescribeFeatureTypeDetailed)', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="id" type="xsd:int" minOccurs="1" maxOccurs="1"/>
          <xsd:element name="tags" type="xsd:string" minOccurs="0" maxOccurs="unbounded" nillable="true"/>
          <xsd:element name="name" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature" type="myns:RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureTypeDetailed(xsd);

    expect(result).toHaveLength(1);
    const fields = result[0].fields;
    expect(fields).toHaveLength(3);

    const idField = fields.find((f) => f.name === 'id');
    expect(idField).toMatchObject({ minOccurs: 1, maxOccurs: 1, nillable: false });

    const tagsField = fields.find((f) => f.name === 'tags');
    expect(tagsField).toMatchObject({ minOccurs: 0, maxOccurs: null, nillable: true });

    // Ni minOccurs, ni maxOccurs, ni nillable déclarés → valeurs par défaut
    const nameField = fields.find((f) => f.name === 'name');
    expect(nameField).toMatchObject({ minOccurs: 0, maxOccurs: 1, nillable: false });
  });

  test('PE2 - champ sans attribut type mais avec un complexType inline → marqué Unknown (rawType="complexType")', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="metadata">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="key" type="xsd:string"/>
                <xsd:element name="value" type="xsd:string"/>
              </xsd:sequence>
            </xsd:complexType>
          </xsd:element>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature" type="myns:RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureTypeDetailed(xsd);

    expect(result).toHaveLength(1);
    const metadataField = result[0].fields.find((f) => f.name === 'metadata');
    expect(metadataField).toMatchObject({ type: FieldTypeEnum.Unknown, rawType: 'complexType' });
  });

  test('PE3 - champ déclaré par référence (ref) plutôt que par name (ex: ref="gml:name") → ignoré sans crash', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element ref="gml:name" minOccurs="0" maxOccurs="unbounded"/>
          <xsd:element name="label" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature" type="myns:RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].attributes).toHaveLength(1);
    expect(result[0].attributes?.[0].key).toBe('label');
  });

  test("ID1 - XML malformé (ex: page d'erreur renvoyée par le serveur) → erreur explicite, pas de plantage silencieux", () => {
    const invalidXml = '<xsd:schema><xsd:complexType name="Broken"</xsd:schema>';

    expect(() => parseDescribeFeatureType(invalidXml)).toThrow(/Erreur de parsing XML/);
  });

  test('MT1 - mapType retrouve un type GML par décomposition de namespace pour un préfixe non standard', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml311="http://www.opengis.net/gml" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="ZoneType">
    <xsd:complexContent>
      <xsd:extension base="gml311:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="geom" type="gml311:MultiPolygonPropertyType"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Zone" substitutionGroup="gml311:_Feature" type="myns:ZoneType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].geometryAttribute?.key).toBe('geom');
    expect(result[0].attributes?.[0].type).toBe(FieldTypeEnum.Geometry);
  });

  test('MT2 - type préfixé sans aucune correspondance (ni directe ni par suffixe) → Unknown', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="PersonPropertyType">
    <xsd:sequence>
      <xsd:element name="name" type="xsd:string"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="owner" type="myns:PersonPropertyType"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature" type="myns:RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    const ownerAttribute = result[0].attributes?.find((a) => a.key === 'owner');
    expect(ownerAttribute?.type).toBe(FieldTypeEnum.Unknown);
    expect(result[0].geometryAttribute).toBeUndefined();
  });

  test("EFCT1 - complexType sans sequence/choice/all → liste d'attributs vide, pas de crash", () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="EmptyType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType"/>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Empty" substitutionGroup="gml:AbstractFeature" type="myns:EmptyType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('myns:Empty');
    expect(result[0].attributes).toEqual([]);
  });

  test('EFCT2 - séquence trouvée via simpleContent > extension', () => {
    // Structure synthétique pour exercer le chemin de code simpleContent > extension
    // (peu courant en pratique, mais géré par le parseur de façon permissive).
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="RoadType">
    <xsd:simpleContent>
      <xsd:extension base="xsd:string">
        <xsd:sequence>
          <xsd:element name="name" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:simpleContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature" type="myns:RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].attributes).toHaveLength(1);
    expect(result[0].attributes?.[0].key).toBe('name');
  });

  test('FACT1 - complexType déclaré sous un namespace XSD non standard → retrouvé via le fallback par localName', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="urn:custom-xsd-namespace" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myns="http://example.com/myns" elementFormDefault="qualified" targetNamespace="http://example.com/myns">
  <xsd:complexType name="RoadType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="name" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="Road" substitutionGroup="gml:AbstractFeature" type="myns:RoadType"/>
</xsd:schema>`;

    const result = parseDescribeFeatureType(xsd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('myns:Road');
    expect(result[0].attributes).toHaveLength(1);
  });
});
