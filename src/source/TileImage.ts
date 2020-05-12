import { TileArcGISRest } from './TileArcGISRest';
import { TileWms } from './TileWms';
import { Wmts } from './Wmts';
import { WmtsCapabilities } from './WmtsCapabilities';
import { Xyz } from './Xyz';

export type TimeImage = TileArcGISRest | TileWms | Wmts | WmtsCapabilities | Xyz;
