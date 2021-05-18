import { SourceTypeEnum } from '../source/types/sourceType';
import { IFeatureType } from '../source/IExtended';
import { ImageWms } from '../source/ImageWms';
import { SourceFactory } from '../source/factory';

/**
 * Load WMS.
 */
export function loadWMS(serverUrl: string, types: IFeatureType<string>[], gisProxyUrl: string): Promise<ImageWms> {
  return new Promise<ImageWms>((resolve) => {
    let url = serverUrl;
    if (gisProxyUrl != null && gisProxyUrl !== '') {
      url = `${gisProxyUrl}/${btoa(serverUrl).replace('=', '%3D').replace('/', '%2F').replace('+', '%2B')}`;
    }
    const imageWms = SourceFactory.create(SourceTypeEnum.ImageWms, { types, url }) as ImageWms;
    resolve(imageWms);
  });
}
