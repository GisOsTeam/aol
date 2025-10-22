import { srcToImage, getWmsLayersFromTypes, loadImageUrlWithHttpEngine } from '../../utils';
import { ILegendRecord, ILegendSource } from '../IExtended';

export async function loadLegendWms(
  source: ILegendSource,
  { loadWithHttpEngine = false }: { loadWithHttpEngine: boolean },
): Promise<ILegendRecord> {
  if (typeof (source as any).getLegendUrl === 'function') {
    let url = (source as any).getLegendUrl(undefined, { TRANSPARENT: true, SLD_VERSION: '1.1.0' });

    if (loadWithHttpEngine) {
      url = await loadImageUrlWithHttpEngine(url);
    }

    const key = getWmsLayersFromTypes((source as any).options.types);
    return srcToImage(
      url,
      // Revoke the object URL when using http engine since it creates blob URL (avoid cache memory leak)
      { revokeDataUrlOnLoad: loadWithHttpEngine },
    ).then((image) => {
      return {
        [key]: [
          {
            image,
            srcImage: image.src,
            height: image.height,
            width: image.width,
          },
        ],
      };
    });
  }
  return Promise.reject(new Error('Source is not a WMS source'));
}
