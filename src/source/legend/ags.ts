import { HttpEngine } from '../../HttpEngine';
import { srcToImage } from '../../utils';
import { ILayerLegend, ILegendRecord, ILegendSource } from '../IExtended';

export function loadLegendAgs(source: ILegendSource): Promise<ILegendRecord> {
  if ((source as any).options != null && (source as any).options.url != null && (source as any).options.types != null) {
    return HttpEngine.getInstance()
      .send({ url: `${(source as any).options.url}/legend?f=json`, responseType: 'json' })
      .then((resp) => {
        const displayedLayers = (source as any).options.types.map((type: any) => type.id);
        const legendResp = resp.body;
        const promises: Promise<[number | string, ILayerLegend]>[] = [];
        for (const layer of legendResp.layers) {
          if (displayedLayers.indexOf(layer.layerId) >= 0) {
            for (const legend of layer.legend) {
              const dataUrl = `data:image/png;base64,${legend.imageData}`;
              promises.push(
                srcToImage(dataUrl).then((image) => {
                  return [
                    layer.layerId,
                    {
                      image,
                      srcImage: dataUrl,
                      label: legend.label || layer.layerName,
                      height: legend.height,
                      width: legend.width,
                    },
                  ];
                })
              );
            }
          }
        }
        return Promise.all(promises).then((layerIdLegends) => {
          const result: ILegendRecord = {};
          for (const layerIdLegend of layerIdLegends) {
            const layerId = layerIdLegend[0];
            if (result[layerId] != null) {
              result[layerId].push(layerIdLegend[1]);
            } else {
              result[layerId] = [layerIdLegend[1]];
            }
          }
          return result;
        });
      });
  }
  return Promise.reject(new Error('Source is not a AGS source'));
}
