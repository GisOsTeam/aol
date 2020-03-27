import Map from 'ol/Map';
import KML from 'ol/format/KML';
import Feature from 'ol/Feature';
import { createSource } from '../utils';
import { LocalVector } from '../source/LocalVector';
import { SourceTypeEnum } from '../source/types/sourceType';

const kmlFormat = new KML({ extractStyles: true, showPointNames: false });

/**
 * Load KML from file.
 */
export function loadKML(file: File, map: Map): Promise<LocalVector> {
  return new Promise<LocalVector>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const kmlString = reader.result as string;
      const name = `${kmlFormat.readName(kmlString)} (${file.name})`;
      const features: Feature[] = kmlFormat.readFeatures(kmlString, {
        featureProjection: map.getView().getProjection(),
      }) as Feature[];
      const localVectorSource = createSource(SourceTypeEnum.LocalVector, { name }) as LocalVector;
      localVectorSource.addFeatures(features);
      resolve(localVectorSource);
    };
    reader.readAsText(file);
  });
}
