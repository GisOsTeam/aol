import { SourceType, SourceTypeEnum } from '../types/sourceType';
import { IFeatureType, ISnapshotSource } from '../IExtended';
import { ExternalVector } from '../ExternalVector';
import { ImageArcGISRest } from '../ImageArcGISRest';
import { ImageStatic } from '../ImageStatic';
import { ImageWms } from '../ImageWms';
import { LocalVector } from '../LocalVector';
import { QueryArcGISRest } from '../QueryArcGISRest';
import { TileArcGISRest } from '../TileArcGISRest';
import { TileWms } from '../TileWms';
import { Wfs } from '../Wfs';
import { Wmts } from '../Wmts';
import { Xyz } from '../Xyz';
import { WmtsCapabilities } from '../WmtsCapabilities';
import { Osm } from '../Osm';

export class SourceFactory {
  public static create(sourceTypeName: SourceType, sourceOptions: any): ISnapshotSource {
    let source: ISnapshotSource;
    switch (sourceTypeName) {
      case SourceTypeEnum.ExternalVector:
        source = new ExternalVector(sourceOptions);
        break;
      case SourceTypeEnum.ImageArcGISRest:
        source = new ImageArcGISRest(sourceOptions);
        break;
      case SourceTypeEnum.ImageStatic:
        source = new ImageStatic(sourceOptions);
        break;
      case SourceTypeEnum.ImageWms:
        source = new ImageWms(sourceOptions);
        break;
      case SourceTypeEnum.LocalVector:
        source = new LocalVector(sourceOptions);
        break;
      case SourceTypeEnum.Osm:
        source = new Osm(sourceOptions);
        break;
      case SourceTypeEnum.QueryArcGISRest:
        source = new QueryArcGISRest(sourceOptions);
        break;
      case SourceTypeEnum.TileArcGISRest:
        source = new TileArcGISRest(sourceOptions);
        break;
      case SourceTypeEnum.TileWms:
        source = new TileWms(sourceOptions);
        break;
      case SourceTypeEnum.Wfs:
        source = new Wfs(sourceOptions);
        break;
      case SourceTypeEnum.Wmts:
        source = new Wmts(sourceOptions);
        break;
      case SourceTypeEnum.WmtsCapabilities:
        source = new WmtsCapabilities(sourceOptions);
        break;
      case SourceTypeEnum.Xyz:
        source = new Xyz(sourceOptions);
        break;
    }
    return source;
  }
}
