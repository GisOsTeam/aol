import { IRetryable } from '../source/IExtended';

/**
 * Sanitizer of source retryable options.
 */
export class SourceRetryableOptionsSanitizer {
  /** Default retries after the initial image load attempt. */
  public static readonly DEFAULT_LOAD_IMAGES_MAX_RETRIES = 0;
  /** Default delay between image load retries, in milliseconds. */
  public static readonly DEFAULT_LOAD_IMAGES_RETRY_DELAY = 1000;

  public static sanitize(sourceOptions: IRetryable): IRetryable {
    return {
      loadImagesMaxRetries:
        sourceOptions.loadImagesMaxRetries ?? SourceRetryableOptionsSanitizer.DEFAULT_LOAD_IMAGES_MAX_RETRIES,
      loadImagesRetryDelay:
        sourceOptions.loadImagesRetryDelay ?? SourceRetryableOptionsSanitizer.DEFAULT_LOAD_IMAGES_RETRY_DELAY,
    };
  }

  private constructor() {
    throw new Error('This class cannot be instantiated');
  }
}
