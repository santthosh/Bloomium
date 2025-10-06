import { fromUrl, GeoTIFF } from 'geotiff';

/**
 * Open a remote GeoTIFF via HTTP range requests
 */
export async function openTiff(url: string): Promise<GeoTIFF> {
  try {
    const tiff = await fromUrl(url);
    return tiff;
  } catch (error) {
    throw new Error(`Failed to open GeoTIFF from ${url}: ${error}`);
  }
}

/**
 * Read a band window from a GeoTIFF
 */
export async function readBandWindow(
  tiff: GeoTIFF,
  bandIndex: number = 0,
  window?: [number, number, number, number] // [xmin, ymin, xmax, ymax]
): Promise<Float32Array> {
  const image = await tiff.getImage(bandIndex);
  
  if (window) {
    const [xmin, ymin, xmax, ymax] = window;
    const width = xmax - xmin;
    const height = ymax - ymin;
    const rasters = await image.readRasters({
      window: [xmin, ymin, xmax, ymax],
      width,
      height,
    });
    return new Float32Array(rasters[0] as ArrayLike<number>);
  }

  const rasters = await image.readRasters();
  return new Float32Array(rasters[0] as ArrayLike<number>);
}

/**
 * Get GeoTIFF metadata including CRS
 */
export async function getTiffMetadata(tiff: GeoTIFF) {
  const image = await tiff.getImage(0);
  const [originX, originY] = image.getOrigin();
  const [resX, resY] = image.getResolution();
  const width = image.getWidth();
  const height = image.getHeight();
  const geoKeys = image.getGeoKeys();
  
  return {
    width,
    height,
    originX,
    originY,
    resX,
    resY,
    geoKeys,
  };
}

