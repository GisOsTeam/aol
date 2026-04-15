import { ITileWfsOptions, TileWfs } from '../../source';
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

describe('aol.source.TileWfs', () => {
  const defaultOptions: ITileWfsOptions = {
    url: 'http://example.com/wfs',
    type: { id: 'test:layer' },
  };

  describe('Constructor', () => {
    test('should create a new TileWfs instance with default options', () => {
      const tileWfs = new TileWfs(defaultOptions);
      expect(tileWfs).toBeInstanceOf(TileWfs);
      expect(tileWfs.getSourceType()).toBe(SourceTypeEnum.TileWfs);
      expect(tileWfs.getLayerType()).toBe(LayerTypeEnum.VectorTile);
      const options = tileWfs.getSourceOptions();
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
      const tileWfs = new TileWfs(defaultOptions);
      expect(tileWfs.isSnapshotable()).toBe(true);
    });

    test('should set listable to true when not specified', () => {
      const tileWfs = new TileWfs(defaultOptions);
      expect(tileWfs.isListable()).toBe(true);
    });

    test('should set removable to true when not specified', () => {
      const tileWfs = new TileWfs(defaultOptions);
      expect(tileWfs.isRemovable()).toBe(true);
    });

    test('should respect snapshotable=false option', () => {
      const tileWfs = new TileWfs({ ...defaultOptions, snapshotable: false });
      expect(tileWfs.isSnapshotable()).toBe(false);
    });

    test('should respect listable=false option', () => {
      const tileWfs = new TileWfs({ ...defaultOptions, listable: false });
      expect(tileWfs.isListable()).toBe(false);
    });

    test('should respect removable=false option', () => {
      const tileWfs = new TileWfs({ ...defaultOptions, removable: false });
      expect(tileWfs.isRemovable()).toBe(false);
    });
  });

  describe('getSourceType', () => {
    test('should return SourceTypeEnum.TileWfs', () => {
      const tileWfs = new TileWfs(defaultOptions);
      expect(tileWfs.getSourceType()).toBeDefined();
      expect(tileWfs.getSourceType()).toBe(SourceTypeEnum.TileWfs);
    });
  });

  describe('getLayerType', () => {
    test('should return LayerTypeEnum.VectorTile', () => {
      const tileWfs = new TileWfs(defaultOptions);
      expect(tileWfs.getLayerType()).toBeDefined();
      expect(tileWfs.getLayerType()).toBe(LayerTypeEnum.VectorTile);
    });
  });

  describe('getSourceOptions', () => {
    test('should return the source options', () => {
      const tileWfs = new TileWfs(defaultOptions);
      const options = tileWfs.getSourceOptions();
      expect(options).toBeDefined();
      expect(options.url).toBe(defaultOptions.url);
      expect(options.type).toBe(defaultOptions.type);
      expect(options.requestProjectionCode).toBe(DEFAULT_WFS_PROJECTION_CODE);
    });
  });

  describe('setSourceOptions', () => {
    test('should update source options', () => {
      const tileWfs = new TileWfs(defaultOptions);
      const newOptions = {
        ...defaultOptions,
        url: 'http://newexample.com/wfs',
        limit: 500,
      };
      tileWfs.setSourceOptions(newOptions);
      const options = tileWfs.getSourceOptions();
      expect(options.url).toBe('http://newexample.com/wfs');
      expect(options.limit).toBe(500);
    });

    test('should keep default values when options are not provided', () => {
      const tileWfs = new TileWfs(defaultOptions);
      tileWfs.setSourceOptions(defaultOptions);
      const options = tileWfs.getSourceOptions();
      expect(options.snapshotable).toBe(true);
      expect(options.listable).toBe(true);
      expect(options.removable).toBe(true);
    });
  });

  describe('setUrls', () => {
    test('should set multiple URLs', () => {
      const tileWfs = new TileWfs(defaultOptions);
      const urls = ['http://url1.com/wfs', 'http://url2.com/wfs'];
      tileWfs.setUrls(urls);
      // The method updates internal state, we verify it doesn't throw
      expect(tileWfs).toBeDefined();
    });

    test('should set single URL', () => {
      const tileWfs = new TileWfs(defaultOptions);
      const urls = ['http://example.com/wfs'];
      tileWfs.setUrls(urls);
      expect(tileWfs).toBeDefined();
    });
  });

  describe('init', () => {
    test('should call WFSInit with options', async () => {
      const { WFSInit } = await import('../../source/common/wfs');
      const tileWfs = new TileWfs(defaultOptions);
      await tileWfs.init();
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
      const tileWfs = new TileWfs(defaultOptions);
      const mockRequest: IQueryRequest = {
        olMap: new OlMap(),
        queryType: 'query',
      };
      await tileWfs.query(mockRequest);
      expect(WFSQuery).toHaveBeenCalledWith(
        tileWfs,
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
      const tileWfs = new TileWfs(defaultOptions);
      const mockRequest: IQueryRequest = {
        olMap: new OlMap(),
        queryType: 'query',
      };
      await tileWfs.query(mockRequest, true);
      expect(WFSQuery).toHaveBeenCalledWith(tileWfs, mockRequest, expect.any(Object), true);
    });
  });

  describe('retrieveFeature', () => {
    test('should call WFSRetrieveFeature with id and projection', async () => {
      const { WFSRetrieveFeature } = await import('../../source/common/wfs');
      const tileWfs = new TileWfs(defaultOptions);
      const projection = new Projection({ code: 'EPSG:4326' });
      await tileWfs.retrieveFeature('feature-123', projection);
      expect(WFSRetrieveFeature).toHaveBeenCalledWith('feature-123', projection, expect.any(Object));
    });

    test('should work with numeric feature id', async () => {
      const { WFSRetrieveFeature } = await import('../../source/common/wfs');
      const tileWfs = new TileWfs(defaultOptions);
      const projection = new Projection({ code: 'EPSG:4326' });
      await tileWfs.retrieveFeature(42, projection);
      expect(WFSRetrieveFeature).toHaveBeenCalledWith(42, projection, expect.any(Object));
    });
  });

  describe('Options handling', () => {
    test('should merge provided options with default options', () => {
      const customOptions: ITileWfsOptions = {
        ...defaultOptions,
        limit: 2000,
        version: '1.1.0',
      };
      const tileWfs = new TileWfs(customOptions);
      const options = tileWfs.getSourceOptions();
      expect(options.limit).toBe(2000);
      expect(options.version).toBe('1.1.0');
    });

    test('should preserve boolean flags when setting options', () => {
      const tileWfs = new TileWfs({
        ...defaultOptions,
        snapshotable: false,
        listable: true,
        removable: false,
      });
      expect(tileWfs.isSnapshotable()).toBe(false);
      expect(tileWfs.isListable()).toBe(true);
      expect(tileWfs.isRemovable()).toBe(false);
    });
  });
});
