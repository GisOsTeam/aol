import { Pixel } from 'ol/pixel';
import { Map, Feature } from 'ol';
import OlBaseLayer from 'ol/layer/Base';
import Layer from 'ol/layer/Layer';
import { IQueryResponse, constructQueryRequestFromPixel, IQueryFeatureTypeResponse, IExtended } from "./IExtended";
import { walk } from "../utils";

export interface IIdentifyResponse {
    features: { [key: string]: Feature[] }
}
export function identify (pixel: Pixel, map: Map) : Promise<IIdentifyResponse> {
    if (map && pixel) {
        const promises: Array<Promise<IQueryResponse>> = [];
        const queryRequest = constructQueryRequestFromPixel(pixel, 2, map);
        queryRequest.limit = 10;
        
        walk(map, (layer: OlBaseLayer) => {
            if (layer.getVisible() && 'getSource' in layer) {
                const source = (layer as Layer).getSource();
                if (source && 'query' in source) {
                    promises.push((source as IExtended).query(queryRequest));
                }
            }
            return true;
        });

        return Promise.all(promises).then((queryResponses: IQueryResponse[]) => {
            const features: any = {};
            queryResponses.forEach((queryResponse: IQueryResponse) => {
                const ftResps = queryResponse.featureTypeResponses;
                ftResps.forEach((ftResp: IQueryFeatureTypeResponse) => {
                    const type = ftResp.type ? ftResp.type.id : 'unknown';
                    if (!features[type]) {
                        features[type] = [];
                    }
                    features[type].push(...ftResp.features);
                });
            });
            return { features };
        });
    }
};