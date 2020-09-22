import { HttpEngine } from '../../HttpEngine';
import { srcToImage, getWmsLayersFromTypes } from '../../utils';
import { ILayerLegend, ILegendSource } from '../IExtended';

export function loadLegendWms(source: ILegendSource): Promise<Record<number | string, ILayerLegend[]>> {
  if (typeof (source as any).getLegendUrl === 'function') {
    const url = (source as any).getLegendUrl(undefined, { TRANSPARENT: true, SLD_VERSION: '1.1.0' });
    /*return HttpEngine.getInstance()
      .send({ url, responseType: 'arraybuffer' })
      .then((res) => {
        const bin = String.fromCharCode.apply(null, new Uint8Array(res.body));
        const key = getWmsLayersFromTypes((source as any).options.types);
        
      });*/
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
  return Promise.reject('Source is not a WMS source');
}
