import { IWfsOptions, Wfs } from '../../source';
import Projection from 'ol/proj/Projection';
import { Feature } from 'ol';
import OlMap from 'ol/Map';
import { IQueryRequest } from '../../source/IExtended';
import { LayerTypeEnum, SourceTypeEnum } from '../../source/types';

// Mock the WFS query functions but keep DEFAULT_OPTIONS real
jest.mock('../../source/query/wfs', () => ({
  loadWfsFeaturesOnBBOX: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../source/common/wfs', () => {
  const actual = jest.requireActual('../../source/common/wfs');
  return {
    ...actual,
    WFSInit: jest.fn(() => Promise.resolve()),
    WFSQuery: jest.fn(() => Promise.resolve({ features: [], total: 0 })),
    WFSRetrieveFeature: jest.fn(() => Promise.resolve(new Feature())),
  };
});

// Import real constants after mocking
import {
  DEFAULT_WFS_LIMIT,
  DEFAULT_WFS_OUTPUT_FORMAT,
  DEFAULT_WFS_PROJECTION_CODE,
  DEFAULT_WFS_VERSION,
} from '../../source/common/wfs';

describe('aol.source.Wfs', () => {
  const defaultOptions: IWfsOptions = {
    url: 'http://example.com/wfs',
    type: { id: 'test:layer' },
  };

  describe('Constructor', () => {
    test('should create a new Wfs instance with default options', () => {
      const wfs = new Wfs(defaultOptions);
      expect(wfs).toBeInstanceOf(Wfs);
      expect(wfs.getSourceType()).toBe(SourceTypeEnum.Wfs);
      expect(wfs.getLayerType()).toBe(LayerTypeEnum.Vector);
      const options = wfs.getSourceOptions();
      expect(options.url).toBe(defaultOptions.url);
      expect(options.type).toBe(defaultOptions.type);
      expect(options.requestProjectionCode).toBe(DEFAULT_WFS_PROJECTION_CODE);
      expect(options.version).toBe(DEFAULT_WFS_VERSION);
      expect(options.outputFormat).toBe(DEFAULT_WFS_OUTPUT_FORMAT);
      expect(options.swapXYBBOXRequest).toBe(false);
      expect(options.swapLonLatGeometryResult).toBe(false);
      expect(options.limit).toBe(DEFAULT_WFS_LIMIT);
    });

    test('should set snapshotable to true when not specified', () => {
      const wfs = new Wfs(defaultOptions);
      expect(wfs.isSnapshotable()).toBe(true);
    });

    test('should set listable to true when not specified', () => {
      const wfs = new Wfs(defaultOptions);
      expect(wfs.isListable()).toBe(true);
    });

    test('should set removable to true when not specified', () => {
      const wfs = new Wfs(defaultOptions);
      expect(wfs.isRemovable()).toBe(true);
    });

    test('should respect snapshotable=false option', () => {
      const wfs = new Wfs({ ...defaultOptions, snapshotable: false });
      expect(wfs.isSnapshotable()).toBe(false);
    });

    test('should respect listable=false option', () => {
      const wfs = new Wfs({ ...defaultOptions, listable: false });
      expect(wfs.isListable()).toBe(false);
    });

    test('should respect removable=false option', () => {
      const wfs = new Wfs({ ...defaultOptions, removable: false });
      expect(wfs.isRemovable()).toBe(false);
    });
  });

  describe('getSourceType', () => {
    test('should return SourceTypeEnum.Wfs', () => {
      const wfs = new Wfs(defaultOptions);
      expect(wfs.getSourceType()).toBeDefined();
      expect(wfs.getSourceType()).toBe(SourceTypeEnum.Wfs);
    });
  });

  describe('getLayerType', () => {
    test('should return LayerTypeEnum.Vector', () => {
      const wfs = new Wfs(defaultOptions);
      expect(wfs.getLayerType()).toBeDefined();
      expect(wfs.getLayerType()).toBe(LayerTypeEnum.Vector);
    });
  });

  describe('getSourceOptions', () => {
    test('should return the source options', () => {
      const wfs = new Wfs(defaultOptions);
      const options = wfs.getSourceOptions();
      expect(options).toBeDefined();
      expect(options.url).toBe(defaultOptions.url);
      expect(options.type).toBe(defaultOptions.type);
      expect(options.requestProjectionCode).toBe(DEFAULT_WFS_PROJECTION_CODE);
    });
  });

  describe('setSourceOptions', () => {
    test('should update source options', () => {
      const wfs = new Wfs(defaultOptions);
      const newOptions = {
        ...defaultOptions,
        url: 'http://newexample.com/wfs',
        limit: 500,
      };
      wfs.setSourceOptions(newOptions);
      const options = wfs.getSourceOptions();
      expect(options.url).toBe('http://newexample.com/wfs');
      expect(options.limit).toBe(500);
    });

    test('should keep default values when options are not provided', () => {
      const wfs = new Wfs(defaultOptions);
      wfs.setSourceOptions(defaultOptions);
      const options = wfs.getSourceOptions();
      expect(options.snapshotable).toBe(true);
      expect(options.listable).toBe(true);
      expect(options.removable).toBe(true);
    });
  });

  describe('init', () => {
    test('should call WFSInit with options', async () => {
      const { WFSInit } = await import('../../source/common/wfs');
      const wfs = new Wfs(defaultOptions);
      await wfs.init();
      expect(WFSInit).toHaveBeenCalled();
      expect(WFSInit).toHaveBeenCalledWith(
        expect.objectContaining({
          url: defaultOptions.url,
          type: defaultOptions.type,
          version: DEFAULT_WFS_VERSION,
          outputFormat: DEFAULT_WFS_OUTPUT_FORMAT,
          requestProjectionCode: DEFAULT_WFS_PROJECTION_CODE,
        }),
      );
    });
  });

  describe('query', () => {
    test('should call WFSQuery with request and options', async () => {
      const { WFSQuery } = await import('../../source/common/wfs');
      const wfs = new Wfs(defaultOptions);
      const mockRequest: IQueryRequest = {
        olMap: new OlMap(),
        queryType: 'query',
      };
      await wfs.query(mockRequest);
      expect(WFSQuery).toHaveBeenCalledWith(
        wfs,
        mockRequest,
        expect.objectContaining({
          url: defaultOptions.url,
          type: defaultOptions.type,
          version: DEFAULT_WFS_VERSION,
          outputFormat: DEFAULT_WFS_OUTPUT_FORMAT,
          requestProjectionCode: DEFAULT_WFS_PROJECTION_CODE,
        }),
        false,
      );
    });

    test('should pass onlyVisible parameter to WFSQuery', async () => {
      const { WFSQuery } = await import('../../source/common/wfs');
      const wfs = new Wfs(defaultOptions);
      const mockRequest: IQueryRequest = {
        olMap: new OlMap(),
        queryType: 'query',
      };
      await wfs.query(mockRequest, true);
      expect(WFSQuery).toHaveBeenCalledWith(wfs, mockRequest, expect.any(Object), true);
    });
  });

  describe('retrieveFeature', () => {
    test('should call WFSRetrieveFeature with id and projection', async () => {
      const { WFSRetrieveFeature } = await import('../../source/common/wfs');
      const wfs = new Wfs(defaultOptions);
      const projection = new Projection({ code: 'EPSG:4326' });
      await wfs.retrieveFeature('feature-123', projection);
      expect(WFSRetrieveFeature).toHaveBeenCalledWith('feature-123', projection, expect.any(Object));
    });

    test('should work with numeric feature id', async () => {
      const { WFSRetrieveFeature } = await import('../../source/common/wfs');
      const wfs = new Wfs(defaultOptions);
      const projection = new Projection({ code: 'EPSG:4326' });
      await wfs.retrieveFeature(42, projection);
      expect(WFSRetrieveFeature).toHaveBeenCalledWith(42, projection, expect.any(Object));
    });
  });

  describe('Options handling', () => {
    test('should merge provided options with default options', () => {
      const customOptions: IWfsOptions = {
        ...defaultOptions,
        limit: 2000,
        version: '1.1.0',
      };
      const wfs = new Wfs(customOptions);
      const options = wfs.getSourceOptions();
      expect(options.limit).toBe(2000);
      expect(options.version).toBe('1.1.0');
    });

    test('should preserve boolean flags when setting options', () => {
      const wfs = new Wfs({
        ...defaultOptions,
        snapshotable: false,
        listable: true,
        removable: false,
      });
      expect(wfs.isSnapshotable()).toBe(false);
      expect(wfs.isListable()).toBe(true);
      expect(wfs.isRemovable()).toBe(false);
    });
  });
});
