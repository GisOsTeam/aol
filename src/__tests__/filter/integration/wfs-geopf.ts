import * as fs from 'fs';
import * as path from 'path';
import { BeforeSendInterceptor as BhreqBeforeSendInterceptor, Engine, IRequest } from 'bhreq';
import { HttpEngine } from '../../../HttpEngine';
import { FieldTypeEnum, FilterBuilderTypeEnum, IField } from '../../../filter';
import {
  AndPre,
  Equal,
  GreaterOrEqualThan,
  Ilike,
  In,
  IPredicate,
  LowerOrEqualThan,
  SpatialPre,
} from '../../../filter/predicate';
import { Equal as EqualOp, Ilike as IlikeOp, In as InOp } from '../../../filter/operator';
import { BoundingBox, Intersects } from '../../../filter/operator/spatial';
import { loadWfsFeaturesOnBBOX } from '../../../source/query/wfs';
import { WfsVersionEnum } from '../../../source/common';

/**
 * Integration test: builds real FES 2.0 <fes:Filter> fragments with this library's predicate
 * classes and sends them, wrapped in a minimal WFS 2.0.0 GetFeature POST XML request, to a
 * live IGN Géoplateforme WFS server. This validates the OGC/FES encoding against a real
 * implementation, beyond what the pure unit tests in FilterBuilder.ts can check.
 *
 * Most tests below use a locally hand-built <wfs:GetFeature> envelope (fetchFeatures) to pin down
 * exactly what <fes:Filter> content each predicate produces; the last describe block instead
 * calls loadWfsFeaturesOnBBOX({ filterFormat: OGC, ... }) directly - the real library function
 * (src/source/query/wfs.ts) - to validate the whole wiring (filter building, XML envelope,
 * HttpEngine POST, response parsing into ol Features) end to end against the live server.
 *
 * Every generated request is also dumped to tmp/wfs-requests/ (gitignored) as its own .xml
 * file, one per test, for manual inspection of the exhaustive list of requests this suite sends.
 */

const SUITE_NAME = 'OGC/FES integration - IGN Géoplateforme WFS 2.0.0';
const WFS_URL = 'https://data.geopf.fr/wfs/ows';
const TYPE_NAME = 'IGNF_LIDAR-HD_METADONNEE:metadata';
const REQUESTS_DUMP_DIR = path.join(__dirname, '..', '..', '..', '..', 'tmp', 'wfs-requests');

/**
 * Writes the given request XML to tmp/wfs-requests/<sanitized test name>.xml, formatted with one
 * tag per line for readability. Purely a debugging aid - not read back by any test.
 */
function dumpRequestXml(testName: string, xml: string): void {
  const fileName = testName
    .replace(SUITE_NAME, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
  const prettyXml = xml.replace(/></g, '>\n<');
  fs.writeFileSync(path.join(REQUESTS_DUMP_DIR, `${fileName}.xml`), prettyXml);
}

interface IGeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{ type: 'Feature'; id: string; properties: Record<string, any> }>;
  numberMatched?: number;
  numberReturned?: number;
  totalFeatures?: number;
}

function buildGetFeatureRequestXml(filterXml: string, count: number): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<wfs:GetFeature service="WFS" version="2.0.0" outputFormat="application/json" count="${count}" ` +
    'xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:fes="http://www.opengis.net/fes/2.0">' +
    `<wfs:Query typeNames="${TYPE_NAME}">` +
    `<fes:Filter>${filterXml}</fes:Filter>` +
    '</wfs:Query>' +
    '</wfs:GetFeature>'
  );
}

async function fetchFeatures(predicate: IPredicate, count = 10): Promise<IGeoJsonFeatureCollection> {
  const filterXml = predicate.toString(FilterBuilderTypeEnum.FES);
  const body = buildGetFeatureRequestXml(filterXml, count);

  dumpRequestXml(expect.getState().currentTestName ?? 'unknown-test', body);

  const res = await HttpEngine.getInstance().send({
    url: WFS_URL,
    method: 'POST',
    contentType: 'application/xml',
    body,
    responseType: 'text',
    timeout: 30000,
  });

  if (res.status !== 200) {
    throw new Error(`WFS GetFeature request error ${res.status}: ${res.text}`);
  }

  return JSON.parse(res.text) as IGeoJsonFeatureCollection;
}

const codeMissionField: IField<string> = { key: 'code_mission', type: FieldTypeEnum.String };
const dateFinAcquisitionField: IField<string> = { key: 'date_fin_acquisition', type: FieldTypeEnum.String };

// Two real code_mission values present on this layer, checked ahead of time against the server.
const KNOWN_CODE_MISSION_1 = '23LHDREUNION';
const KNOWN_CODE_MISSION_2 = '24LHDOE2';

const geometryField: IField<string> = { key: 'geom', type: FieldTypeEnum.Geometry };
// A point and a polygon (lon, lat / EPSG:4326) checked ahead of time to fall inside / overlap
// the polygon of a real tile (id "metadata.1", code_mission 23LHDREUNION), and its bounding box.
const POINT_INSIDE_KNOWN_TILE_WKT = 'POINT(55.63 -20.916)';
const POLYGON_AROUND_KNOWN_TILE_WKT = 'POLYGON((55.62 -20.92,55.64 -20.92,55.64 -20.91,55.62 -20.91,55.62 -20.92))';
const BBOX_AROUND_KNOWN_TILE = "55.62,-20.92,55.64,-20.91,'EPSG:4326'";
// Null Island: intersects no LiDAR HD tile (metropolitan France or overseas).
const POINT_WITH_NO_MATCH_WKT = 'POINT(0 0)';

describe(SUITE_NAME, () => {
  beforeAll(() => {
    // Start from a clean dump directory so it only ever reflects the current run's requests.
    fs.rmSync(REQUESTS_DUMP_DIR, { recursive: true, force: true });
    fs.mkdirSync(REQUESTS_DUMP_DIR, { recursive: true });

    const engine = Engine.getInstance();
    const interceptor = (request: IRequest) => {
      if (!request.timeout) {
        request.timeout = 30000;
      }
      return request;
    };
    engine.beforeSendInterceptors.push(interceptor as BhreqBeforeSendInterceptor);
    HttpEngine.setInstance(engine);
  });

  test('Equal (string): code_mission = known value', async () => {
    const predicate = new Equal(codeMissionField, new EqualOp(), KNOWN_CODE_MISSION_1);
    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toBeGreaterThan(0);
    for (const feature of collection.features) {
      expect(feature.properties.code_mission).toEqual(KNOWN_CODE_MISSION_1);
    }
  });

  test('GreaterOrEqualThan (date): date_fin_acquisition >= 2023-01-01', async () => {
    const predicate = new GreaterOrEqualThan(dateFinAcquisitionField, '2023-01-01');
    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toBeGreaterThan(0);
    for (const feature of collection.features) {
      const date = String(feature.properties.date_fin_acquisition).slice(0, 10);
      expect(date >= '2023-01-01').toBe(true);
    }
  });

  test('AndPre: code_mission = known value AND date_fin_acquisition >= 2023-01-01', async () => {
    const equalPredicate = new Equal(codeMissionField, new EqualOp(), KNOWN_CODE_MISSION_1);
    const dateGreaterPredicate = new GreaterOrEqualThan(dateFinAcquisitionField, '2023-01-01');
    const predicate = new AndPre(equalPredicate, dateGreaterPredicate);

    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toBeGreaterThan(0);
    for (const feature of collection.features) {
      expect(feature.properties.code_mission).toEqual(KNOWN_CODE_MISSION_1);
      expect(String(feature.properties.date_fin_acquisition).slice(0, 10) >= '2023-01-01').toBe(true);
    }
  });

  test('Ilike: code_mission matches a lowercase pattern (case-insensitive)', async () => {
    const predicate = new Ilike(codeMissionField, new IlikeOp(), '%reunion%');
    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toBeGreaterThan(0);
    for (const feature of collection.features) {
      expect(String(feature.properties.code_mission).toUpperCase()).toContain('REUNION');
    }
  });

  test('In: code_mission in [known value 1, known value 2]', async () => {
    const predicate = new In(codeMissionField, new InOp(), [KNOWN_CODE_MISSION_1, KNOWN_CODE_MISSION_2]);
    const collection = await fetchFeatures(predicate, 50);

    expect(collection.features.length).toBeGreaterThan(0);
    for (const feature of collection.features) {
      expect([KNOWN_CODE_MISSION_1, KNOWN_CODE_MISSION_2]).toContain(feature.properties.code_mission);
    }
  });

  test('Equal with an unknown value returns no features (no server error)', async () => {
    const predicate = new Equal(codeMissionField, new EqualOp(), 'DOES_NOT_EXIST_XYZ');
    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toEqual(0);
  });

  test('BBOX: geom within a bounding box around a known tile', async () => {
    const predicate = new SpatialPre(geometryField, BBOX_AROUND_KNOWN_TILE, new BoundingBox());
    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toBeGreaterThan(0);
    expect(collection.features.some((feature) => feature.properties.code_mission === KNOWN_CODE_MISSION_1)).toBe(true);
  });

  test('Intersects: geom intersects a point inside a known tile, with an explicit srsName', async () => {
    const predicate = new SpatialPre(
      geometryField,
      POINT_INSIDE_KNOWN_TILE_WKT,
      new Intersects(),
      'EPSG:4326', // required: without it, the server assumes the layer's native CRS and matches nothing (see SpatialPredicate.ts).
    );
    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toBeGreaterThan(0);
    expect(collection.features.some((feature) => feature.properties.code_mission === KNOWN_CODE_MISSION_1)).toBe(true);
  });

  test('Intersects: without an srsName, a WGS84 WKT point matches nothing (known limitation)', async () => {
    // Documents the limitation described in SpatialPredicate.ts: omitting srsName makes the
    // server interpret the coordinates in its own native CRS, so an otherwise-correct point
    // silently matches nothing instead of erroring.
    const predicate = new SpatialPre(geometryField, POINT_INSIDE_KNOWN_TILE_WKT, new Intersects());
    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toEqual(0);
  });

  test('Intersects: a point that is not on any tile returns no features (no server error)', async () => {
    const predicate = new SpatialPre(geometryField, POINT_WITH_NO_MATCH_WKT, new Intersects(), 'EPSG:4326');
    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toEqual(0);
  });

  test('Intersects AND a date range: geom intersects a known tile whose date_fin_acquisition falls within 2023', async () => {
    const intersectsPredicate = new SpatialPre(
      geometryField,
      POLYGON_AROUND_KNOWN_TILE_WKT,
      new Intersects(),
      'EPSG:4326',
    );
    const dateRangePredicate = new AndPre(
      new GreaterOrEqualThan(dateFinAcquisitionField, '2023-01-01'),
      new LowerOrEqualThan(dateFinAcquisitionField, '2023-12-31'),
    );
    const predicate = new AndPre(intersectsPredicate, dateRangePredicate);

    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toBeGreaterThan(0);
    for (const feature of collection.features) {
      expect(feature.properties.code_mission).toEqual(KNOWN_CODE_MISSION_1);
      const date = String(feature.properties.date_fin_acquisition).slice(0, 10);
      expect(date >= '2023-01-01' && date <= '2023-12-31').toBe(true);
    }
  });

  test('Intersects AND a date range: a range excluding the known tile date returns no features', async () => {
    // Same spatial predicate as above (it alone matches metadata.1), but a date range from a
    // different year: proves the temporal filter is genuinely narrowing the spatial match,
    // not just being ignored server-side.
    const intersectsPredicate = new SpatialPre(
      geometryField,
      POLYGON_AROUND_KNOWN_TILE_WKT,
      new Intersects(),
      'EPSG:4326',
    );
    const dateRangePredicate = new AndPre(
      new GreaterOrEqualThan(dateFinAcquisitionField, '2020-01-01'),
      new LowerOrEqualThan(dateFinAcquisitionField, '2020-12-31'),
    );
    const predicate = new AndPre(intersectsPredicate, dateRangePredicate);

    const collection = await fetchFeatures(predicate);

    expect(collection.features.length).toEqual(0);
  });

  describe('loadWfsFeaturesOnBBOX with filterFormat = OGC (real library wiring, not a hand-built envelope)', () => {
    test('Equal filter: returns real ol Features matching the known code_mission', async () => {
      const features = await loadWfsFeaturesOnBBOX({
        bbox: [],
        featureProjectionCode: 'EPSG:4326',
        filterFormat: FilterBuilderTypeEnum.FES,
        filters: new Equal(codeMissionField, new EqualOp(), KNOWN_CODE_MISSION_1),
        limit: 10,
        method: 'POST',
        outputFormat: 'application/json',
        queryType: 'query',
        requestProjectionCode: 'EPSG:4326',
        type: { id: TYPE_NAME },
        url: WFS_URL,
        version: WfsVersionEnum.V2_0_0,
      });

      expect(features.length).toBeGreaterThan(0);
      for (const feature of features) {
        expect(feature.get('code_mission')).toEqual(KNOWN_CODE_MISSION_1);
      }
    });

    test('bbox + a date-range filter combined by the library into one fes:And', async () => {
      const features = await loadWfsFeaturesOnBBOX({
        bbox: [55.62, -20.92, 55.64, -20.91],
        featureProjectionCode: 'EPSG:4326',
        filterFormat: FilterBuilderTypeEnum.FES,
        filters: new AndPre(
          new GreaterOrEqualThan(dateFinAcquisitionField, '2023-01-01'),
          new LowerOrEqualThan(dateFinAcquisitionField, '2023-12-31'),
        ),
        limit: 10,
        method: 'POST',
        outputFormat: 'application/json',
        queryType: 'query',
        requestProjectionCode: 'EPSG:4326',
        type: { id: TYPE_NAME, geometryAttribute: { key: 'geom', type: FieldTypeEnum.Geometry } },
        url: WFS_URL,
        version: WfsVersionEnum.V2_0_0,
      });

      expect(features.length).toBeGreaterThan(0);
      for (const feature of features) {
        expect(feature.get('code_mission')).toEqual(KNOWN_CODE_MISSION_1);
      }
    });

    test('rejects when version is not 2.0.0, without sending any request', async () => {
      await expect(
        loadWfsFeaturesOnBBOX({
          bbox: [],
          featureProjectionCode: 'EPSG:4326',
          filterFormat: FilterBuilderTypeEnum.FES,
          filters: new Equal(codeMissionField, new EqualOp(), KNOWN_CODE_MISSION_1),
          limit: 10,
          method: 'POST',
          outputFormat: 'application/json',
          queryType: 'query',
          requestProjectionCode: 'EPSG:4326',
          type: { id: TYPE_NAME },
          url: WFS_URL,
          version: WfsVersionEnum.V1_1_0,
        }),
      ).rejects.toThrow("requires WFS version '2.0.0'");
    });
  });
});
