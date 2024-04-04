import Map from 'ol/Map';
import KML from 'ol/format/KML';
import Feature from 'ol/Feature';
import * as JSZip from 'jszip';
import { LocalVector } from '../source/LocalVector';
import { SourceTypeEnum } from '../source/types/sourceType';
import { SourceFactory } from '../source/factory';

const kmlFormat = new KML({ extractStyles: true, showPointNames: false });

/**
 * Load KMZ from file.
 */
export function loadKMZ(file: File, map: Map): Promise<LocalVector> {
  return new Promise<LocalVector>((resolve, reject) => {
    const zipFile = new JSZip();
    zipFile.loadAsync(file).then((zip) => {
      const promises = Object.keys(zip.files)
        .map((name) => zip.files[name])
        .map(
          (entry) =>
            new Promise<{ name: string; data: string }>((resolve2) => {
              entry.async('blob').then((blob) => {
                if (/\.(jpe?g|png|gif|bmp)$/i.test(entry.name)) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    resolve2({
                      name: entry.name,
                      data: reader.result as any,
                    });
                  };
                  reader.readAsDataURL(blob);
                } else {
                  const reader = new FileReader();
                  reader.onload = () => {
                    resolve2({
                      name: entry.name,
                      data: reader.result as any,
                    });
                  };
                  reader.readAsText(blob);
                }
              });
            }),
        );
      Promise.all(promises).then(
        (elements) => {
          const imageElements = elements.filter((element) => /\.(jpe?g|png|gif|bmp)$/i.test(element.name));
          const docElement = elements.filter((element) => element.name === 'doc.kml').pop();
          let kmlString = docElement.data;
          imageElements.forEach((imageElement) => {
            const imageName = imageElement.name.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
            kmlString = kmlString.replace(new RegExp(imageName, 'g'), imageElement.data);
          });
          const name = `${kmlFormat.readName(kmlString)} (${file.name})`;
          const features: Feature[] = kmlFormat.readFeatures(kmlString, {
            featureProjection: map.getView().getProjection(),
          }) as Feature[];
          const localVectorSource = SourceFactory.create(SourceTypeEnum.LocalVector, { name }) as LocalVector;
          localVectorSource.addFeatures(features);
          resolve(localVectorSource);
        },
        (err) => {
          reject(err);
        },
      );
    });
  });
}
