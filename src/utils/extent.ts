import { Extent, getForViewAndSize } from 'ol/extent';

export function calculateGeoExtent(originalExtent: Extent, geoTolerance: number): Extent {
  // Calcul de la largeur géo référencée comprenant la largeur de l'étendue originale et 2 * la tolérance (gauche et droite)
  const geoWidth = Math.abs(originalExtent[2] - originalExtent[0]) + 2 * geoTolerance;
  // Calcul de la hauteur géo référencée comprenant la hauteur de l'étendue originale et 2 * la tolérance (haut et bas)
  const geoHeight = Math.abs(originalExtent[3] - originalExtent[1]) + 2 * geoTolerance;
  // Calcul du centre de l'étendue originale
  const originalExtentCenter = [
    0.5 * originalExtent[0] + 0.5 * originalExtent[2],
    0.5 * originalExtent[1] + 0.5 * originalExtent[3],
  ];
  // Calcule de l'étendue intégrant la tolérance
  return getForViewAndSize(
    originalExtentCenter,
    1, // 1 car déjà en géo !
    0, // 0 car déjà en géo !
    [geoWidth, geoHeight]
  );
}
