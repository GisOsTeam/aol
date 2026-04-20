import {
  ICommonWmsOptions,
  WMSBuildFilter,
  WMSFetchLegend,
  WMSGetTypePredicateAsMap,
  WMSHandlePropertyChange,
  WMSInit,
  WMSInitializeOptions,
  WMSLoadDescription,
  WMSMergeOptions,
  WMSQuery,
  WMSRetrieveFeature,
  WMSSetSourceOptions,
  WmsVersionEnum,
  DEFAULT_WMS_LIMIT,
  DEFAULT_WMS_PROJECTION_CODE,
  DEFAULT_WMS_QUERY_FORMAT,
  DEFAULT_WMS_VERSION,
} from '../../../source/common/wms';
import { IFeatureType, IGisRequest, ILayerLegend } from '../../../source/IExtended';
import { Equal, IPredicate, Like } from '../../../filter/predicate';
import { Equal as EqualOp, Like as LikeOp } from '../../../filter/operator';
import { FieldTypeEnum, IField } from '../../../filter';
import * as queryModule from '../../../source/query';
import * as wfsModule from '../../../source/common/wfs';
import * as legendModule from '../../../source/legend';

// ---- Mock des modules externes ----

jest.mock('../../../source/query', () => ({
  executeWfsQuery: jest.fn(),
  executeWmsQuery: jest.fn(),
  loadWmsFeatureDescription: jest.fn(),
  retrieveWfsFeature: jest.fn(),
  retrieveWmsFeature: jest.fn(),
}));

jest.mock('../../../source/common/wfs', () => ({
  ...jest.requireActual('../../../source/common/wfs'),
  WFSLoadDescription: jest.fn(),
}));

jest.mock('../../../source/legend', () => ({
  loadLegendWms: jest.fn(),
}));

// ---- Helpers ----

const BASE_OPTIONS = {
  url: 'http://example.com/wms',
  types: [{ id: 'ns:layer' }],
  version: WmsVersionEnum.V1_3_0,
  queryMethod: 'GET',
  queryFormat: DEFAULT_WMS_QUERY_FORMAT,
  requestProjectionCode: DEFAULT_WMS_PROJECTION_CODE,
  swapLonLatGeometryResult: false,
  swapXYBBOXRequest: false,
  limit: DEFAULT_WMS_LIMIT,
  loadImagesWithHttpEngine: false,
  queryWfsUrl: null,
  snapshotable: true,
  listable: true,
  removable: true,
} as Required<ICommonWmsOptions>;

const createMockSnapshotSource = () => ({
  setSourceOptions: jest.fn(),
  getSourceType: jest.fn(),
  getSourceOptions: jest.fn(),
  getLayerType: jest.fn(),
  isSnapshotable: jest.fn(),
  isListable: jest.fn(),
  isRemovable: jest.fn(),
});

const createMockConfigurableSource = () => ({
  on: jest.fn(),
  un: jest.fn(),
  set: jest.fn(),
  updateParams: jest.fn(),
  getParams: jest.fn().mockReturnValue({}),
});

const mockRequest: IGisRequest = {
  olMap: {} as any,
  geometry: {} as any,
  geometryProjection: {} as any,
  queryType: 'query',
};

const stringField: IField<any> = { type: FieldTypeEnum.String, key: 'region' };
const equalPredicate: IPredicate = new Equal(stringField, new EqualOp(), 'Normandie');
const likePredicate: IPredicate = new Like(stringField, new LikeOp(), '%Bretagne%');

// ==========================================
// WMSMergeOptions
// ==========================================
describe('aol.source.common.wms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WMSMergeOptions', () => {
    test('M1 — newOptions override oldOptions', () => {
      const oldOptions: Partial<ICommonWmsOptions> = { url: 'http://old.com', limit: 100 };
      const newOptions: Partial<ICommonWmsOptions> = { url: 'http://new.com' };
      const result = WMSMergeOptions(oldOptions, newOptions);
      expect(result.url).toBe('http://new.com');
      expect(result.limit).toBe(100);
    });

    test('M2 — oldOptions vides', () => {
      const result = WMSMergeOptions({}, { url: 'http://new.com', types: [{ id: 'ns:layer' }] });
      expect(result.url).toBe('http://new.com');
      expect(result.types).toEqual([{ id: 'ns:layer' }]);
    });

    test('M3 — newOptions vides', () => {
      const oldOptions: Partial<ICommonWmsOptions> = { url: 'http://old.com', limit: 200 };
      const result = WMSMergeOptions(oldOptions, {});
      expect(result.url).toBe('http://old.com');
      expect(result.limit).toBe(200);
    });
  });

  // ==========================================
  // WMSInitializeOptions
  // ==========================================
  describe('WMSInitializeOptions', () => {
    const baseInput: ICommonWmsOptions = { url: 'http://example.com', types: [{ id: 'ns:layer' }] };

    test('I1 — snapshotable non défini → true', () => {
      expect(WMSInitializeOptions({ ...baseInput }).snapshotable).toBe(true);
    });

    test('I2 — snapshotable = false → conservé', () => {
      expect(WMSInitializeOptions({ ...baseInput, snapshotable: false }).snapshotable).toBe(false);
    });

    test('I3 — listable non défini → true', () => {
      expect(WMSInitializeOptions({ ...baseInput }).listable).toBe(true);
    });

    test('I4 — listable = false → conservé', () => {
      expect(WMSInitializeOptions({ ...baseInput, listable: false }).listable).toBe(false);
    });

    test('I5 — removable non défini → true', () => {
      expect(WMSInitializeOptions({ ...baseInput }).removable).toBe(true);
    });

    test('I6 — removable = false → conservé', () => {
      expect(WMSInitializeOptions({ ...baseInput, removable: false }).removable).toBe(false);
    });

    test('I7 — queryWfsUrl = undefined → null', () => {
      expect(WMSInitializeOptions({ ...baseInput }).queryWfsUrl).toBeNull();
    });

    test('I8 — queryWfsUrl = null → null', () => {
      expect(WMSInitializeOptions({ ...baseInput, queryWfsUrl: null }).queryWfsUrl).toBeNull();
    });

    test('I9 — queryWfsUrl = string → conservé', () => {
      expect(WMSInitializeOptions({ ...baseInput, queryWfsUrl: 'http://wfs.com' }).queryWfsUrl).toBe('http://wfs.com');
    });

    test('I10 — fusion avec les valeurs par défaut', () => {
      const result = WMSInitializeOptions({ ...baseInput });
      expect(result.version).toBe(DEFAULT_WMS_VERSION);
      expect(result.queryFormat).toBe(DEFAULT_WMS_QUERY_FORMAT);
      expect(result.requestProjectionCode).toBe(DEFAULT_WMS_PROJECTION_CODE);
      expect(result.limit).toBe(DEFAULT_WMS_LIMIT);
      expect(result.loadImagesWithHttpEngine).toBe(false);
      expect(result.queryMethod).toBe('GET');
    });
  });

  // ==========================================
  // WMSGetTypePredicateAsMap
  // ==========================================
  describe('WMSGetTypePredicateAsMap', () => {
    test('G1 — types vide → map vide', () => {
      expect(WMSGetTypePredicateAsMap([])).toEqual(new Map());
    });

    test('G2 — type avec predicate, absent de la map → ajouté', () => {
      const types: IFeatureType<string>[] = [{ id: 'ns:layer', predicate: equalPredicate }];
      const result = WMSGetTypePredicateAsMap(types);
      expect(result.has('ns:layer')).toBe(true);
      expect(result.get('ns:layer')).toBe(equalPredicate);
    });

    test('G3 — type sans predicate → non ajouté', () => {
      const types: IFeatureType<string>[] = [{ id: 'ns:layer' }];
      expect(WMSGetTypePredicateAsMap(types).has('ns:layer')).toBe(false);
    });

    test('G4 — id en doublon → première entrée conservée', () => {
      const types: IFeatureType<string>[] = [
        { id: 'ns:layer', predicate: equalPredicate },
        { id: 'ns:layer', predicate: likePredicate },
      ];
      const result = WMSGetTypePredicateAsMap(types);
      expect(result.get('ns:layer')).toBe(equalPredicate);
    });
  });

  // ==========================================
  // WMSInit
  // ==========================================
  describe('WMSInit', () => {
    const mockWFSLoadDescription = wfsModule.WFSLoadDescription as jest.Mock;
    const mockLoadWmsFeatureDescription = queryModule.loadWmsFeatureDescription as jest.Mock;

    beforeEach(() => {
      mockWFSLoadDescription.mockResolvedValue(undefined);
      mockLoadWmsFeatureDescription.mockResolvedValue(undefined);
    });

    test('IN1 — queryWfsUrl !== null → WFSLoadDescription appelé', async () => {
      const source = createMockSnapshotSource();
      const options: Required<ICommonWmsOptions> = {
        ...BASE_OPTIONS,
        queryWfsUrl: 'http://wfs.com',
        types: [{ id: 'ns:layer' }],
      };
      await WMSInit(options, source as any);
      expect(mockWFSLoadDescription).toHaveBeenCalledTimes(1);
      expect(mockLoadWmsFeatureDescription).not.toHaveBeenCalled();
      expect(source.setSourceOptions).toHaveBeenCalledWith(options);
    });

    test('IN2 — queryWfsUrl === null → loadWmsFeatureDescription appelé', async () => {
      const source = createMockSnapshotSource();
      const options: Required<ICommonWmsOptions> = { ...BASE_OPTIONS, queryWfsUrl: null };
      await WMSInit(options, source as any);
      expect(mockLoadWmsFeatureDescription).toHaveBeenCalledTimes(1);
      expect(mockWFSLoadDescription).not.toHaveBeenCalled();
      expect(source.setSourceOptions).toHaveBeenCalledWith(options);
    });

    test('IN3 — plusieurs types → une promesse par type', async () => {
      const source = createMockSnapshotSource();
      const options: Required<ICommonWmsOptions> = {
        ...BASE_OPTIONS,
        queryWfsUrl: null,
        types: [{ id: 'ns:layer1' }, { id: 'ns:layer2' }, { id: 'ns:layer3' }],
      };
      await WMSInit(options, source as any);
      expect(mockLoadWmsFeatureDescription).toHaveBeenCalledTimes(3);
    });

    test('IN4 — types vides → setSourceOptions appelé sans description', async () => {
      const source = createMockSnapshotSource();
      const options: Required<ICommonWmsOptions> = { ...BASE_OPTIONS, types: [] };
      await WMSInit(options, source as any);
      expect(mockLoadWmsFeatureDescription).not.toHaveBeenCalled();
      expect(mockWFSLoadDescription).not.toHaveBeenCalled();
      expect(source.setSourceOptions).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // WMSSetSourceOptions
  // ==========================================
  describe('WMSSetSourceOptions', () => {
    const newImageLoadFn = jest.fn();
    const existingLoadFn = jest.fn();
    const handlePropertyChange = jest.fn();

    test('SS1 — loadImagesWithHttpEngine=true, defaultLoadFunction=undefined → sauvegarde et applique la nouvelle', () => {
      const source = createMockConfigurableSource();
      const getLoadFn = jest.fn().mockReturnValue(existingLoadFn);
      const setLoadFn = jest.fn();
      WMSSetSourceOptions(
        { ...BASE_OPTIONS, loadImagesWithHttpEngine: true, types: [{ id: 'ns:layer' }] },
        source as any,
        getLoadFn,
        setLoadFn,
        newImageLoadFn,
        undefined,
        new Map(),
        {},
        handlePropertyChange,
      );
      expect(getLoadFn).toHaveBeenCalledTimes(1);
      expect(setLoadFn).toHaveBeenCalledWith(newImageLoadFn);
    });

    test('SS2 — loadImagesWithHttpEngine=true, defaultLoadFunction déjà défini → getLoadFunction non ré-appelé', () => {
      const source = createMockConfigurableSource();
      const getLoadFn = jest.fn();
      const setLoadFn = jest.fn();
      WMSSetSourceOptions(
        { ...BASE_OPTIONS, loadImagesWithHttpEngine: true, types: [{ id: 'ns:layer' }] },
        source as any,
        getLoadFn,
        setLoadFn,
        newImageLoadFn,
        existingLoadFn,
        new Map(),
        {},
        handlePropertyChange,
      );
      expect(getLoadFn).not.toHaveBeenCalled();
      expect(setLoadFn).toHaveBeenCalledWith(newImageLoadFn);
    });

    test('SS3 — loadImagesWithHttpEngine=false, defaultLoadFunction défini → restaure la fonction par défaut', () => {
      const source = createMockConfigurableSource();
      const getLoadFn = jest.fn();
      const setLoadFn = jest.fn();
      WMSSetSourceOptions(
        { ...BASE_OPTIONS, loadImagesWithHttpEngine: false, types: [{ id: 'ns:layer' }] },
        source as any,
        getLoadFn,
        setLoadFn,
        newImageLoadFn,
        existingLoadFn,
        new Map(),
        {},
        handlePropertyChange,
      );
      expect(getLoadFn).not.toHaveBeenCalled();
      expect(setLoadFn).toHaveBeenCalledWith(existingLoadFn);
    });

    test('SS4 — loadImagesWithHttpEngine=false, defaultLoadFunction=undefined → aucun changement de load function', () => {
      const source = createMockConfigurableSource();
      const getLoadFn = jest.fn();
      const setLoadFn = jest.fn();
      WMSSetSourceOptions(
        { ...BASE_OPTIONS, loadImagesWithHttpEngine: false, types: [{ id: 'ns:layer' }] },
        source as any,
        getLoadFn,
        setLoadFn,
        newImageLoadFn,
        undefined,
        new Map(),
        {},
        handlePropertyChange,
      );
      expect(getLoadFn).not.toHaveBeenCalled();
      expect(setLoadFn).not.toHaveBeenCalled();
    });

    test('SS5 — cqlFilter non vide → CQL_FILTER dans les params', () => {
      const source = createMockConfigurableSource();
      const types: IFeatureType<string>[] = [{ id: 'ns:layer', predicate: equalPredicate }];
      const defaultPredicateMap = WMSGetTypePredicateAsMap(types);
      WMSSetSourceOptions(
        { ...BASE_OPTIONS, types },
        source as any,
        jest.fn(),
        jest.fn(),
        newImageLoadFn,
        undefined,
        defaultPredicateMap,
        {},
        handlePropertyChange,
      );
      const callArgs = source.updateParams.mock.calls[0][0] as Record<string, unknown>;
      expect(callArgs).toHaveProperty('CQL_FILTER');
      expect(typeof callArgs['CQL_FILTER']).toBe('string');
      expect((callArgs['CQL_FILTER'] as string).length).toBeGreaterThan(0);
    });

    test('SS6 — cqlFilter vide → CQL_FILTER absent des params', () => {
      const source = createMockConfigurableSource();
      WMSSetSourceOptions(
        { ...BASE_OPTIONS, types: [{ id: 'ns:layer' }] },
        source as any,
        jest.fn(),
        jest.fn(),
        newImageLoadFn,
        undefined,
        new Map(),
        {},
        handlePropertyChange,
      );
      const callArgs = source.updateParams.mock.calls[0][0] as Record<string, unknown>;
      expect(callArgs).not.toHaveProperty('CQL_FILTER');
    });
  });

  // ==========================================
  // WMSLoadDescription
  // ==========================================
  describe('WMSLoadDescription', () => {
    test('LD1 — délègue à loadWmsFeatureDescription avec les bons paramètres', async () => {
      const mockFn = queryModule.loadWmsFeatureDescription as jest.Mock;
      mockFn.mockResolvedValue(undefined);
      const type: IFeatureType<string> = { id: 'ns:layer' };
      await WMSLoadDescription(BASE_OPTIONS, type);
      expect(mockFn).toHaveBeenCalledWith({
        url: BASE_OPTIONS.url,
        type,
        method: BASE_OPTIONS.queryMethod,
        version: BASE_OPTIONS.version,
        outputFormat: BASE_OPTIONS.queryFormat,
        requestProjectionCode: BASE_OPTIONS.requestProjectionCode,
      });
    });
  });

  // ==========================================
  // WMSQuery
  // ==========================================
  describe('WMSQuery', () => {
    const mockExecuteWfsQuery = queryModule.executeWfsQuery as jest.Mock;
    const mockExecuteWmsQuery = queryModule.executeWmsQuery as jest.Mock;
    const fakeResponse = { type: { id: 'ns:layer' }, features: [] as any[] };

    beforeEach(() => {
      mockExecuteWfsQuery.mockResolvedValue(fakeResponse);
      mockExecuteWmsQuery.mockResolvedValue(fakeResponse);
    });

    test('Q1 — onlyVisible=false → tous les types interrogés même hidden', async () => {
      const options: Required<ICommonWmsOptions> = {
        ...BASE_OPTIONS,
        types: [{ id: 'ns:visible' }, { id: 'ns:hidden', hide: true }],
      };
      await WMSQuery({} as any, mockRequest, options, false);
      expect(mockExecuteWmsQuery).toHaveBeenCalledTimes(2);
    });

    test('Q2 — onlyVisible=true, type visible → inclus', async () => {
      const options: Required<ICommonWmsOptions> = { ...BASE_OPTIONS, types: [{ id: 'ns:visible' }] };
      await WMSQuery({} as any, mockRequest, options, true);
      expect(mockExecuteWmsQuery).toHaveBeenCalledTimes(1);
    });

    test('Q3 — onlyVisible=true, type hide=true → exclu', async () => {
      const options: Required<ICommonWmsOptions> = {
        ...BASE_OPTIONS,
        types: [{ id: 'ns:hidden', hide: true }],
      };
      await WMSQuery({} as any, mockRequest, options, true);
      expect(mockExecuteWmsQuery).not.toHaveBeenCalled();
    });

    test('Q4 — queryWfsUrl !== null → executeWfsQuery appelé', async () => {
      const options: Required<ICommonWmsOptions> = { ...BASE_OPTIONS, queryWfsUrl: 'http://wfs.com' };
      await WMSQuery({} as any, mockRequest, options);
      expect(mockExecuteWfsQuery).toHaveBeenCalledTimes(1);
      expect(mockExecuteWmsQuery).not.toHaveBeenCalled();
    });

    test('Q5 — queryWfsUrl === null → executeWmsQuery appelé', async () => {
      const options: Required<ICommonWmsOptions> = { ...BASE_OPTIONS, queryWfsUrl: null };
      await WMSQuery({} as any, mockRequest, options);
      expect(mockExecuteWmsQuery).toHaveBeenCalledTimes(1);
      expect(mockExecuteWfsQuery).not.toHaveBeenCalled();
    });

    test('Q6 — types vides → featureTypeResponses vide', async () => {
      const options: Required<ICommonWmsOptions> = { ...BASE_OPTIONS, types: [] };
      const result = await WMSQuery({} as any, mockRequest, options);
      expect(result.featureTypeResponses).toEqual([]);
      expect(result.request).toBe(mockRequest);
    });

    test('Q7 — queryWfsUrl !== null, request.method absent → assigné depuis queryMethod', async () => {
      const options: Required<ICommonWmsOptions> = {
        ...BASE_OPTIONS,
        queryWfsUrl: 'http://wfs.com',
        queryMethod: 'POST',
      };
      const request = { ...mockRequest };
      delete (request as any).method;
      await WMSQuery({} as any, request as any, options);
      expect((request as any).method).toBe('POST');
    });

    test('Q8 — queryWfsUrl !== null, request.method déjà défini → conservé tel quel', async () => {
      const options: Required<ICommonWmsOptions> = {
        ...BASE_OPTIONS,
        queryWfsUrl: 'http://wfs.com',
        queryMethod: 'POST',
      };
      const request = { ...mockRequest, method: 'GET' as const };
      await WMSQuery({} as any, request as any, options);
      expect(request.method).toBe('GET');
    });
  });

  // ==========================================
  // WMSRetrieveFeature
  // ==========================================
  describe('WMSRetrieveFeature', () => {
    const mockRetrieveWfsFeature = queryModule.retrieveWfsFeature as jest.Mock;
    const mockRetrieveWmsFeature = queryModule.retrieveWmsFeature as jest.Mock;
    const fakeFeature = { getId: () => 42 } as any;
    const projection = {} as any;

    test('R1 — queryWfsUrl != null → retrieveWfsFeature appelé', async () => {
      mockRetrieveWfsFeature.mockResolvedValue(fakeFeature);
      const options: Required<ICommonWmsOptions> = { ...BASE_OPTIONS, queryWfsUrl: 'http://wfs.com' };
      const result = await WMSRetrieveFeature(42, projection, options);
      expect(mockRetrieveWfsFeature).toHaveBeenCalledTimes(1);
      expect(mockRetrieveWmsFeature).not.toHaveBeenCalled();
      expect(result).toBe(fakeFeature);
    });

    test('R2 — queryWfsUrl == null → retrieveWmsFeature appelé', async () => {
      mockRetrieveWmsFeature.mockResolvedValue(fakeFeature);
      const options: Required<ICommonWmsOptions> = { ...BASE_OPTIONS, queryWfsUrl: null };
      const result = await WMSRetrieveFeature(42, projection, options);
      expect(mockRetrieveWmsFeature).toHaveBeenCalledTimes(1);
      expect(mockRetrieveWfsFeature).not.toHaveBeenCalled();
      expect(result).toBe(fakeFeature);
    });

    test('R3 — feature trouvée → retournée', async () => {
      mockRetrieveWmsFeature.mockResolvedValue(fakeFeature);
      const result = await WMSRetrieveFeature(42, projection, BASE_OPTIONS);
      expect(result).toBe(fakeFeature);
    });

    test('R4 — aucune feature (tout undefined) → undefined', async () => {
      mockRetrieveWmsFeature.mockResolvedValue(undefined);
      const options: Required<ICommonWmsOptions> = {
        ...BASE_OPTIONS,
        types: [{ id: 'ns:layer1' }, { id: 'ns:layer2' }],
      };
      const result = await WMSRetrieveFeature(42, projection, options);
      expect(result).toBeUndefined();
    });

    test('R5 — plusieurs types → première feature définie retournée', async () => {
      const secondFeature = { getId: () => 99 } as any;
      mockRetrieveWmsFeature
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(secondFeature)
        .mockResolvedValueOnce(fakeFeature);
      const options: Required<ICommonWmsOptions> = {
        ...BASE_OPTIONS,
        types: [{ id: 'ns:layer1' }, { id: 'ns:layer2' }, { id: 'ns:layer3' }],
      };
      const result = await WMSRetrieveFeature(42, projection, options);
      expect(result).toBe(secondFeature);
    });
  });

  // ==========================================
  // WMSHandlePropertyChange
  // ==========================================
  describe('WMSHandlePropertyChange', () => {
    test("H1 — key === 'types' → updateParams appelé et options.types mis à jour", () => {
      const source = {
        updateParams: jest.fn(),
        getParams: jest.fn().mockReturnValue({}),
      };
      const options = { ...BASE_OPTIONS } as Required<ICommonWmsOptions>;
      const newTypes: IFeatureType<string>[] = [{ id: 'ns:new-layer' }];
      const event = { key: 'types', target: { get: jest.fn().mockReturnValue(newTypes) } };
      WMSHandlePropertyChange(event, options, source as any);
      expect(source.updateParams).toHaveBeenCalledWith(
        expect.objectContaining({ TRANSPARENT: 'TRUE', VERSION: BASE_OPTIONS.version }),
      );
      expect(options.types).toBe(newTypes);
    });

    test("H2 — key !== 'types' → aucune action", () => {
      const source = { updateParams: jest.fn(), getParams: jest.fn() };
      const options = { ...BASE_OPTIONS } as Required<ICommonWmsOptions>;
      const event = { key: 'url', target: { get: jest.fn().mockReturnValue('http://other.com') } };
      WMSHandlePropertyChange(event, options, source as any);
      expect(source.updateParams).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // WMSFetchLegend
  // ==========================================
  describe('WMSFetchLegend', () => {
    const mockLoadLegendWms = legendModule.loadLegendWms as jest.Mock;
    const cachedLegend: Record<string, ILayerLegend[]> = { 'ns:layer': [] };
    const freshLegend: Record<string, ILayerLegend[]> = {
      'ns:layer': [{ srcImage: 'img', image: {} as any, height: 10, width: 10 }],
    };
    const mockSource = {} as any;

    beforeEach(() => {
      mockLoadLegendWms.mockResolvedValue(freshLegend);
    });

    test('F1 — fetchLegendoptions=undefined → refresh=false par défaut, retourne le cache', async () => {
      const result = await WMSFetchLegend(cachedLegend, mockSource, BASE_OPTIONS, undefined);
      expect(mockLoadLegendWms).not.toHaveBeenCalled();
      expect(result).toBe(cachedLegend);
    });

    test('F2 — forceLoadWithHttpEngine=true → override loadWithHttpEngine', async () => {
      const options = { ...BASE_OPTIONS, loadImagesWithHttpEngine: false };
      await WMSFetchLegend(null as any, mockSource, options, { forceLoadWithHttpEngine: true });
      expect(mockLoadLegendWms).toHaveBeenCalledWith(mockSource, { loadWithHttpEngine: true });
    });

    test('F3 — forceLoadWithHttpEngine=null → utilise commonWmsOptions.loadImagesWithHttpEngine', async () => {
      const options = { ...BASE_OPTIONS, loadImagesWithHttpEngine: true };
      await WMSFetchLegend(null as any, mockSource, options, { forceLoadWithHttpEngine: undefined });
      expect(mockLoadLegendWms).toHaveBeenCalledWith(mockSource, { loadWithHttpEngine: true });
    });

    test('F4 — refresh=false ET cache disponible → retourne le cache sans appel réseau', async () => {
      const result = await WMSFetchLegend(cachedLegend, mockSource, BASE_OPTIONS, { refresh: false });
      expect(mockLoadLegendWms).not.toHaveBeenCalled();
      expect(result).toBe(cachedLegend);
    });

    test('F5 — refresh=true → loadLegendWms appelé même si cache disponible', async () => {
      const result = await WMSFetchLegend(cachedLegend, mockSource, BASE_OPTIONS, { refresh: true });
      expect(mockLoadLegendWms).toHaveBeenCalledTimes(1);
      expect(result).toBe(freshLegend);
    });

    test('F6 — cache falsy (null) → loadLegendWms appelé', async () => {
      const result = await WMSFetchLegend(null as any, mockSource, BASE_OPTIONS, { refresh: false });
      expect(mockLoadLegendWms).toHaveBeenCalledTimes(1);
      expect(result).toBe(freshLegend);
    });
  });

  // ==========================================
  // WMSBuildFilter
  // ==========================================
  describe('WMSBuildFilter', () => {
    test('B1 — types vide → retourne ""', () => {
      expect(WMSBuildFilter([], new Map())).toBe('');
    });

    test('B1 — types null → retourne ""', () => {
      expect(WMSBuildFilter(null as any, new Map())).toBe('');
    });

    test('B2 — predicate dans defaultTypePredicateAsMap uniquement → filtre non vide', () => {
      const types: IFeatureType<string>[] = [{ id: 'ns:layer' }];
      const map = new Map<string, IPredicate>([['ns:layer', equalPredicate]]);
      const result = WMSBuildFilter(types, map);
      expect(result).toBeTruthy();
      expect(result).toContain('region');
    });

    test('B3 — predicate dans type.predicate uniquement → filtre non vide', () => {
      const types: IFeatureType<string>[] = [{ id: 'ns:layer', predicate: equalPredicate }];
      const result = WMSBuildFilter(types, new Map());
      expect(result).toBeTruthy();
      expect(result).toContain('region');
    });

    test('B4 — predicates des deux sources avec hashs différents → combinaison AND', () => {
      const types: IFeatureType<string>[] = [{ id: 'ns:layer', predicate: likePredicate }];
      const map = new Map<string, IPredicate>([['ns:layer', equalPredicate]]);
      const result = WMSBuildFilter(types, map);
      expect(result).toContain('AND');
      expect(result).toContain('region');
    });

    test('B5 — même predicate dans les deux sources (même hash) → pas de double application', () => {
      const types: IFeatureType<string>[] = [{ id: 'ns:layer', predicate: equalPredicate }];
      const map = new Map<string, IPredicate>([['ns:layer', equalPredicate]]);
      const singleResult = WMSBuildFilter([{ id: 'ns:layer', predicate: equalPredicate }], new Map());
      const result = WMSBuildFilter(types, map);
      expect(result).toBe(singleResult);
      expect(result).not.toContain('AND');
    });

    test('B6 — type sans predicate → ne contribue pas au filtre', () => {
      const types: IFeatureType<string>[] = [{ id: 'ns:no-predicate' }];
      expect(WMSBuildFilter(types, new Map())).toBe('');
    });

    test('B7 — plusieurs types avec filtres → jointure avec ";"', () => {
      const types: IFeatureType<string>[] = [
        { id: 'ns:layer1', predicate: equalPredicate },
        { id: 'ns:layer2', predicate: likePredicate },
      ];
      const result = WMSBuildFilter(types, new Map());
      expect(result).toContain(';');
      const parts = result.split(';');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBeTruthy();
      expect(parts[1]).toBeTruthy();
    });

    test('B8 — un seul type avec filtre → pas de ";" en tête ni en queue', () => {
      const types: IFeatureType<string>[] = [{ id: 'ns:layer', predicate: equalPredicate }];
      const result = WMSBuildFilter(types, new Map());
      expect(result).not.toContain(';');
      expect(result.startsWith(';')).toBe(false);
      expect(result.endsWith(';')).toBe(false);
    });
  });
});
