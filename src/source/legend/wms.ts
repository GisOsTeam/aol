import { HttpEngine } from '../../HttpEngine';
import { srcToImage, getWmsLayersFromTypes } from '../../utils';
import { ILayerLegend, ILegendRecord, ILegendSource } from '../IExtended';

export function loadLegendWms(source: ILegendSource): Promise<ILegendRecord> {
  if (typeof (source as any).getLegendUrl === 'function') {
    const url = (source as any).getLegendUrl(undefined, { TRANSPARENT: true, SLD_VERSION: '1.1.0' });
    const key = getWmsLayersFromTypes((source as any).options.types);
    return srcToImage(url).then((image) => {
      return {
        [key]: [
          {
            image,
            srcImage: url,
            height: image.height,
            width: image.width,
          },
        ],
      };
    });
  }
  return Promise.reject(new Error('Source is not a WMS source'));
}
