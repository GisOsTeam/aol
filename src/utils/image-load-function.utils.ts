import { loadImageUrlWithHttpEngine } from '../utils';
import { Image as OlImage, Tile as OlTile } from 'ol';
import { ImageLike } from 'ol/DataTile';
import { LoadFunction as OlImageLoadFunction } from 'ol/Image';
import { LoadFunction as OlTileLoadFunction } from 'ol/Tile';
import TileState from 'ol/TileState';

export const imageLoadWithHttpEngineFunction: OlImageLoadFunction = async (olImage: OlImage, src: string) => {
  const image: ImageLike = olImage.getImage();

  if ('src' in image) {
    try {
      const url = await loadImageUrlWithHttpEngine(src);
      image.src = url;

      const savedOnload = image.onload;
      image.onload = () => {
        if (savedOnload) {
          savedOnload.apply(image);
        }
        URL.revokeObjectURL(url); // LOADED
      };

      const savedOnerror = image.onerror;
      image.onerror = () => {
        if (savedOnerror) {
          savedOnerror.apply(image);
        }
        console.error('Error loading image for image source from url', src);
        URL.revokeObjectURL(url); // ERROR
      };
    } catch (error) {
      console.error('Error loading image with http engine', src, error);
    }
  } else {
    console.error('Property src missing from image element', image);
  }
};

export const tileLoadWithHttpEngineFunction: OlTileLoadFunction = async (olTile: OlTile, src: string) => {
  if ('getImage' in olTile && typeof olTile.getImage === 'function') {
    const image: ImageLike = olTile.getImage();
    if ('src' in image) {
      try {
        olTile.setState(TileState.LOADING);

        const url = await loadImageUrlWithHttpEngine(src);
        image.src = url;

        const savedOnload = image.onload;
        image.onload = () => {
          if (savedOnload) {
            savedOnload.apply(image);
          }
          URL.revokeObjectURL(url); // LOADED
          olTile.setState(TileState.LOADED);
        };

        const savedOnerror = image.onerror;
        image.onerror = () => {
          if (savedOnerror) {
            savedOnerror.apply(image);
          }
          console.error('Error loading image for tile', olTile, 'from url', src);
          olTile.setState(TileState.ERROR);
          URL.revokeObjectURL(url); // ERROR
        };
      } catch (error) {
        console.error('Error loading tile image with http engine', src, error);
        olTile.setState(TileState.ERROR);
      }
    } else {
      console.error('Property src missing from image element', image);
      olTile.setState(TileState.ERROR);
    }
  } else {
    console.error('Function getImage missing from tile element', olTile);
    olTile.setState(TileState.ERROR);
  }
};
