import { loadImageAsObjectUrlWithHttpEngine } from '../utils';
import { Image as OlImage, Tile as OlTile } from 'ol';
import { ImageLike } from 'ol/DataTile';
import { LoadFunction as OlImageLoadFunction } from 'ol/Image';
import { LoadFunction as OlTileLoadFunction } from 'ol/Tile';
import TileState from 'ol/TileState';

/** Default retries after the initial image load attempt. */
export const DEFAULT_LOAD_IMAGES_MAX_RETRIES = 0;
/** Default delay between image load retries, in milliseconds. */
export const DEFAULT_LOAD_IMAGES_RETRY_DELAY = 1000;

/** Triggers OpenLayers' terminal image error after retries are exhausted. */
const INVALID_IMAGE_SRC = 'data:image/png;base64,';

/** Retry settings shared by the image and tile loaders. */
interface ImageLoadRetryOptions {
  maxRetries: number;
  retryDelay: number;
}

/**
 * Validate retry settings once when creating a loader.
 * @param maxRetries Number of retries allowed after the initial attempt.
 * @param retryDelay Delay between retries, in milliseconds.
 * @returns Validated retry settings.
 * @throws {RangeError} If either setting is outside its supported range.
 */
function getRetryOptions(maxRetries: number, retryDelay: number): ImageLoadRetryOptions {
  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new RangeError('loadImagesMaxRetries must be a non-negative integer');
  }
  if (!Number.isFinite(retryDelay) || retryDelay < 0) {
    throw new RangeError('loadImagesRetryDelay must be a non-negative finite number');
  }
  return { maxRetries, retryDelay };
}

/**
 * Verify that a blob URL contains a decodable image before passing it to OpenLayers.
 * @param src Blob URL to validate.
 * @returns A promise that resolves when the image loads or rejects when decoding fails.
 */
function waitForImageLoad(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use a temporary image so failed decodes can be retried without changing OpenLayers' load state.
    const image = new Image();
    const cleanup = () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
    const handleLoad = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error(`Failed to decode image from ${src}`));
    };

    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);
    image.src = src;
  });
}

/**
 * Fetch and validate an image, retrying request or decode failures.
 * @param src Original image URL requested by OpenLayers.
 * @param retryOptions Retry count and delay.
 * @param retriesRemaining Retries left after the current attempt; defaults to the configured maximum.
 * @returns The object URL of a verified image.
 * @throws The last request or decode error after all retries fail.
 */
async function loadImageUrlWithRetries(
  src: string,
  retryOptions: ImageLoadRetryOptions,
  retriesRemaining = retryOptions.maxRetries,
): Promise<string> {
  let objectUrl: string | undefined;
  try {
    objectUrl = await loadImageAsObjectUrlWithHttpEngine(src);
    await waitForImageLoad(objectUrl);
    return objectUrl;
  } catch (error) {
    if (objectUrl !== undefined) {
      // Discard a failed blob before retrying or propagating the error.
      URL.revokeObjectURL(objectUrl);
    }
    if (retriesRemaining === 0) {
      throw error;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, retryOptions.retryDelay));
    return loadImageUrlWithRetries(src, retryOptions, retriesRemaining - 1);
  }
}

/**
 * Assign a verified object URL and revoke it when the image finishes loading.
 * @param image OpenLayers' target image element.
 * @param src Verified object URL to display.
 */
function setImageSource(image: HTMLImageElement | HTMLVideoElement, src: string): void {
  const revokeObjectUrl = () => {
    image.removeEventListener('load', revokeObjectUrl);
    image.removeEventListener('error', revokeObjectUrl);
    URL.revokeObjectURL(src);
  };
  image.addEventListener('load', revokeObjectUrl, { once: true });
  image.addEventListener('error', revokeObjectUrl, { once: true });
  image.src = src;
}

/**
 * Create an OpenLayers image loader backed by HttpEngine.
 * @param loadImagesMaxRetries Retries after the initial request; zero disables retries.
 * @param loadImagesRetryDelay Delay between retries, in milliseconds.
 * @returns An OpenLayers image load function.
 * @throws {RangeError} If the retry count or delay is invalid.
 */
export function createImageLoadWithHttpEngineFunction(
  loadImagesMaxRetries = DEFAULT_LOAD_IMAGES_MAX_RETRIES,
  loadImagesRetryDelay = DEFAULT_LOAD_IMAGES_RETRY_DELAY,
): OlImageLoadFunction {
  const retryOptions = getRetryOptions(loadImagesMaxRetries, loadImagesRetryDelay);

  return async (olImage: OlImage, src: string) => {
    const image: ImageLike = olImage.getImage();

    if ('src' in image) {
      try {
        const url = await loadImageUrlWithRetries(src, retryOptions);
        setImageSource(image, url);
      } catch (error) {
        console.error(`Error loading image with http engine after ${retryOptions.maxRetries} retries`, src, error);
        // Signal the final failure so OpenLayers can leave its loading state.
        image.src = INVALID_IMAGE_SRC;
      }
    } else {
      console.error('Property src missing from image element', image);
    }
  };
}

/**
 * Create an OpenLayers tile loader backed by HttpEngine.
 * @param loadImagesMaxRetries Retries after the initial request; zero disables retries.
 * @param loadImagesRetryDelay Delay between retries, in milliseconds.
 * @returns An OpenLayers tile load function that remains pending through retries.
 * @throws {RangeError} If the retry count or delay is invalid.
 */
export function createTileLoadWithHttpEngineFunction(
  loadImagesMaxRetries = DEFAULT_LOAD_IMAGES_MAX_RETRIES,
  loadImagesRetryDelay = DEFAULT_LOAD_IMAGES_RETRY_DELAY,
): OlTileLoadFunction {
  const retryOptions = getRetryOptions(loadImagesMaxRetries, loadImagesRetryDelay);

  return async (olTile: OlTile, src: string) => {
    if ('getImage' in olTile && typeof olTile.getImage === 'function') {
      const image: ImageLike = olTile.getImage();
      if ('src' in image) {
        try {
          // Keep OpenLayers' tile queue waiting while retries are pending.
          if (olTile.getState() !== TileState.LOADING) {
            olTile.setState(TileState.LOADING);
          }
          const url = await loadImageUrlWithRetries(src, retryOptions);
          setImageSource(image, url);
        } catch (error) {
          console.error(
            `Error loading tile image with http engine after ${retryOptions.maxRetries} retries`,
            src,
            error,
          );
          // Report a terminal failure only after all retries have been exhausted.
          image.src = INVALID_IMAGE_SRC;
        }
      } else {
        console.error('Property src missing from image element', image);
        olTile.setState(TileState.ERROR);
      }
    } else {
      console.error('Function getImage missing from tile element', olTile);
      olTile.setState(TileState.ERROR);
    }
  };
}

export const imageLoadWithHttpEngineFunction = createImageLoadWithHttpEngineFunction();
export const tileLoadWithHttpEngineFunction = createTileLoadWithHttpEngineFunction();
