import { TileArcGISRest } from './TileArcGISRest';
import { TileWms } from './TileWms';
import { Xyz } from './Xyz';

export type TimeImage = TileArcGISRest | TileWms | Xyz;
