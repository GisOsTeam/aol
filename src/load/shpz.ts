import Map from 'ol/Map';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import * as JSZip from 'jszip';
import * as shapefile2geojson from 'shapefile2geojson';
import { LocalVector } from '../source/LocalVector';
import { SourceTypeEnum } from '../source/types/sourceType';
import { addProjection } from '../ProjectionInfo';
import { SourceFactory } from '../source/factory';
import { checkJSZipSecurity, ZipSecurityCheckOptions } from '../utils/zipSecurityCheck';

interface ILoadShpzOptions {
  zipSecurityCheckOpts?: ZipSecurityCheckOptions;
}
export type LoadShpzOptions = ILoadShpzOptions;

const geoJSONFormat = new GeoJSON();

/**
 * Load zipped Shapefile from file.
 */
export function loadZippedShapefile(file: File, map: Map, opts?: LoadShpzOptions): Promise<LocalVector> {
  return new Promise<LocalVector>((resolve, reject) => {
    const zipFile = new JSZip();
    zipFile.loadAsync(file).then(
      async (zip) => {
        // Check ZIP secure
        if ((await checkJSZipSecurity(zip, opts?.zipSecurityCheckOpts)) === false) {
          reject('Security check failed on ZIP');
        }
        const promises = Object.keys(zip.files)
          .map((name) => zip.files[name])
          .map(
            (entry) =>
              new Promise<{ name: string; data: string }>((resolve2) => {
                entry.async('blob').then((blob) => {
                  if (entry.name.endsWith('.prj')) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      resolve2({
                        name: entry.name,
                        data: reader.result as any,
                      });
                    };
                    reader.readAsText(blob);
                  } else {
                    const reader = new FileReader();
                    reader.onload = () => {
                      resolve2({
                        name: entry.name,
                        data: reader.result as any,
                      });
                    };
                    reader.readAsArrayBuffer(blob);
                  }
                });
              }),
          );
        Promise.all(promises).then(
          (elements) => {
            try {
              const dbfElement = elements.filter((element) => element.name.endsWith('.dbf')).pop();
              const shpElement = elements.filter((element) => element.name.endsWith('.shp')).pop();
              const prjElement = elements.filter((element) => element.name.endsWith('.prj')).pop();
              const featureCollection = shapefile2geojson(shpElement.data, dbfElement.data);
              const name = shpElement.name;
              const featureProjection = map.getView().getProjection();
              let dataProjection = featureProjection;
              if (prjElement != null) {
                dataProjection = addProjection(prjElement.name, prjElement.data).projection;
              }
              const features: Feature[] = geoJSONFormat.readFeatures(featureCollection, {
                dataProjection,
                featureProjection,
              }) as Feature[];
              const localVectorSource = SourceFactory.create(SourceTypeEnum.LocalVector, { name }) as LocalVector;
              localVectorSource.addFeatures(features);
              resolve(localVectorSource);
            } catch (err) {
              reject(err);
            }
          },
          (err) => {
            reject(err);
          },
        );
      },
      (err) => {
        reject(err);
      },
    );
  });
}
