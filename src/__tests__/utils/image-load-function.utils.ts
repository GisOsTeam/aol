import ImageWrapper, { decode } from 'ol/Image';
import ImageTile from 'ol/ImageTile';
import ImageState from 'ol/ImageState';
import TileState from 'ol/TileState';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { ImageArcGISRest } from '../../source/ImageArcGISRest';
import { ImageWms } from '../../source/ImageWms';
import { TileWms } from '../../source/TileWms';
import { Wmts } from '../../source/Wmts';
import { Xyz } from '../../source/Xyz';
import { loadImageAsObjectUrlWithHttpEngine } from '../../utils';
import {
  createImageLoadWithHttpEngineFunction,
  createTileLoadWithHttpEngineFunction,
  imageLoadWithHttpEngineFunction,
  tileLoadWithHttpEngineFunction,
} from '../../utils/image-load-function.utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  loadImageAsObjectUrlWithHttpEngine: jest.fn(),
}));

const IMAGE_SRC = 'https://example.test/image.png';
const loadImageMock = jest.mocked(loadImageAsObjectUrlWithHttpEngine);
let blobImageLoadOutcomes: boolean[] = [];
let imageSrcDescriptor: PropertyDescriptor | undefined;
let revokeObjectUrlDescriptor: PropertyDescriptor | undefined;

describe('image load functions with retries', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    blobImageLoadOutcomes = [];
    loadImageMock.mockReset();

    imageSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true,
      get(this: HTMLImageElement) {
        return this.getAttribute('src') ?? '';
      },
      set(this: HTMLImageElement, src: string) {
        this.setAttribute('src', src);
        if (src.startsWith('blob:')) {
          const shouldLoad = blobImageLoadOutcomes.shift();
          if (shouldLoad !== false) {
            Object.defineProperty(this, 'naturalWidth', { configurable: true, value: 256 });
            Object.defineProperty(this, 'naturalHeight', { configurable: true, value: 256 });
            this.dispatchEvent(new Event('load'));
          } else {
            this.dispatchEvent(new Event('error'));
          }
        } else {
          this.dispatchEvent(new Event('error'));
        }
      },
    });

    revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();

    if (imageSrcDescriptor) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', imageSrcDescriptor);
    } else {
      Reflect.deleteProperty(HTMLImageElement.prototype, 'src');
    }
    if (revokeObjectUrlDescriptor) {
      Object.defineProperty(URL, 'revokeObjectURL', revokeObjectUrlDescriptor);
    } else {
      Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
  });

  test('keeps a tile loading between failed requests and retries after one second', async () => {
    loadImageMock
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('blob:tile');

    const tile = createTile(
      createTileLoadWithHttpEngineFunction({ loadImagesMaxRetries: 2, loadImagesRetryDelay: 1000 }),
    );
    tile.load();
    expect(tile.getState()).toBe(TileState.LOADING);

    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(999);
    expect(loadImageMock).toHaveBeenCalledTimes(1);
    expect(tile.getState()).toBe(TileState.LOADING);

    await jest.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(tile.getState()).toBe(TileState.LOADING);

    await jest.advanceTimersByTimeAsync(1000);
    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(3);
    expect(tile.getState()).toBe(TileState.LOADED);
  });

  test('marks a tile as errored only after the initial request and all three retries fail', async () => {
    loadImageMock.mockRejectedValue(new Error('network error'));

    const tile = createTile(
      createTileLoadWithHttpEngineFunction({ loadImagesMaxRetries: 3, loadImagesRetryDelay: 1000 }),
    );
    tile.load();
    await flushPromises();

    for (let retry = 1; retry <= 3; retry++) {
      await jest.advanceTimersByTimeAsync(1000);
      await flushPromises();
      expect(loadImageMock).toHaveBeenCalledTimes(retry + 1);
      if (retry < 3) {
        expect(tile.getState()).toBe(TileState.LOADING);
      }
    }

    expect(tile.getState()).toBe(TileState.ERROR);
  });

  test('uses the configured retry count and delay for tiles', async () => {
    loadImageMock.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce('blob:tile');

    const tile = createTile(
      createTileLoadWithHttpEngineFunction({ loadImagesMaxRetries: 1, loadImagesRetryDelay: 100 }),
    );
    tile.load();
    await flushPromises();

    expect(loadImageMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(99);
    expect(loadImageMock).toHaveBeenCalledTimes(1);
    expect(tile.getState()).toBe(TileState.LOADING);

    await jest.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(tile.getState()).toBe(TileState.LOADED);
  });

  test('does not retry by default', async () => {
    loadImageMock.mockRejectedValue(new Error('network error'));

    const tile = createTile();
    tile.load();
    await flushPromises();

    expect(loadImageMock).toHaveBeenCalledTimes(1);
    expect(tile.getState()).toBe(TileState.ERROR);
  });

  test('uses the configured retry count and delay for image sources', async () => {
    loadImageMock.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce('blob:image');

    const image = createImageWrapper(
      createImageLoadWithHttpEngineFunction({ loadImagesMaxRetries: 1, loadImagesRetryDelay: 100 }),
    );
    image.load();
    await flushPromises();

    expect(loadImageMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(99);
    expect(loadImageMock).toHaveBeenCalledTimes(1);
    expect(image.getState()).toBe(ImageState.LOADING);

    await jest.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(image.getState()).toBe(ImageState.LOADED);
  });

  test('uses retry options configured on ImageArcGISRest', async () => {
    loadImageMock.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce('blob:arcgis');

    const source = new ImageArcGISRest({
      url: IMAGE_SRC,
      types: [],
      loadImagesWithHttpEngine: true,
      loadImagesMaxRetries: 1,
      loadImagesRetryDelay: 100,
    });
    const image = createImageWrapper(source.getImageLoadFunction());
    image.load();
    await flushPromises();

    expect(loadImageMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(100);
    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(image.getState()).toBe(ImageState.LOADED);
  });

  test('uses retry options configured on ImageWms', async () => {
    loadImageMock.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce('blob:image-wms');

    const source = new ImageWms({
      url: IMAGE_SRC,
      types: [],
      loadImagesWithHttpEngine: true,
      loadImagesMaxRetries: 1,
      loadImagesRetryDelay: 100,
    });
    const image = createImageWrapper(source.getImageLoadFunction());
    image.load();
    await flushPromises();

    expect(loadImageMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(100);
    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(image.getState()).toBe(ImageState.LOADED);
  });

  test('uses retry options configured on TileWms', async () => {
    loadImageMock.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce('blob:tile-wms');

    const source = new TileWms({
      url: IMAGE_SRC,
      params: {},
      types: [],
      loadImagesWithHttpEngine: true,
      loadImagesMaxRetries: 1,
      loadImagesRetryDelay: 100,
    });
    const tile = createTile(source.getTileLoadFunction());
    tile.load();
    await flushPromises();

    expect(loadImageMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(100);
    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(tile.getState()).toBe(TileState.LOADED);
  });

  test('uses retry options configured on Wmts', async () => {
    loadImageMock.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce('blob:wmts');

    const source = new Wmts({
      layer: 'test-layer',
      matrixSet: 'test-matrix-set',
      style: 'default',
      tileGrid: new WMTSTileGrid({
        origin: [0, 0],
        resolutions: [1],
        matrixIds: ['0'],
      }),
      url: IMAGE_SRC,
      loadImagesWithHttpEngine: true,
      loadImagesMaxRetries: 1,
      loadImagesRetryDelay: 100,
    });
    const tile = createTile(source.getTileLoadFunction());
    tile.load();
    await flushPromises();

    expect(source.getSourceOptions().loadImagesMaxRetries).toBe(1);
    expect(loadImageMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(100);
    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(tile.getState()).toBe(TileState.LOADED);
  });

  test('uses retry options configured on Xyz', async () => {
    loadImageMock.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce('blob:xyz');

    const source = new Xyz({
      url: IMAGE_SRC,
      loadImagesWithHttpEngine: true,
      loadImagesMaxRetries: 1,
      loadImagesRetryDelay: 100,
    });
    const tile = createTile(source.getTileLoadFunction());
    tile.load();
    await flushPromises();

    expect(source.getSourceOptions().loadImagesMaxRetries).toBe(1);
    expect(loadImageMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(100);
    await flushPromises();
    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(tile.getState()).toBe(TileState.LOADED);
  });

  test('keeps an image source loading while retrying an invalid image blob', async () => {
    loadImageMock.mockResolvedValueOnce('blob:invalid').mockResolvedValueOnce('blob:valid');
    blobImageLoadOutcomes = [false, true, true];

    const image = createImageWrapper(
      createImageLoadWithHttpEngineFunction({ loadImagesMaxRetries: 1, loadImagesRetryDelay: 1000 }),
    );
    image.load();
    await flushPromises();

    expect(loadImageMock).toHaveBeenCalledTimes(1);
    expect(image.getState()).toBe(ImageState.LOADING);

    await jest.advanceTimersByTimeAsync(1000);
    await flushPromises();

    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(image.getState()).toBe(ImageState.LOADED);
  });
});

function createTile(tileLoadFunction = tileLoadWithHttpEngineFunction): ImageTile {
  return new ImageTile([0, 0, 0], TileState.IDLE, IMAGE_SRC, null, tileLoadFunction);
}

function createImageWrapper(imageLoadFunction = imageLoadWithHttpEngineFunction): ImageWrapper {
  const imageRef: { current?: ImageWrapper } = {};
  const image = new ImageWrapper([0, 0, 10, 10], 1, 1, () => {
    const element = new Image();
    const currentImage = imageRef.current;
    if (!currentImage) {
      throw new Error('Image wrapper has not been initialized');
    }
    currentImage.setImage(element);
    void imageLoadFunction(currentImage, IMAGE_SRC);
    return decode(element);
  });
  imageRef.current = image;
  return image;
}

async function flushPromises(): Promise<void> {
  for (let index = 0; index < 5; index++) {
    await Promise.resolve();
  }
}
