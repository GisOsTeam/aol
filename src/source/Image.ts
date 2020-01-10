import { ImageArcGISRest } from './ImageArcGISRest';
import { ImageStatic } from './ImageStatic';
import { ImageWms } from './ImageWms';

export type Image = ImageArcGISRest | ImageStatic | ImageWms;
