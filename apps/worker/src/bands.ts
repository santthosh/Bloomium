import proj4 from 'proj4';
import { BBox, Grid, Mask, BandSet, STACItem } from './types';
import { openTiff, getTiffMetadata } from './fetch';

/**
 * Read and align B03, B05, and SCL bands to common 10m grid
 */
export async function readBandSet(item: STACItem, bbox: BBox): Promise<BandSet> {
  console.log(`   📡 Reading bands: ${item.id}`);

  // Get asset URLs (handle case variations)
  const b03Asset = item.assets['B03'] || item.assets['b03'] || item.assets['green'];
  const b05Asset = item.assets['B05'] || item.assets['b05'] || item.assets['rededge1'];
  const sclAsset = item.assets['SCL'] || item.assets['scl'];

  if (!b03Asset || !b05Asset || !sclAsset) {
    throw new Error(
      `Missing required bands in scene ${item.id}: B03=${!!b03Asset}, B05=${!!b05Asset}, SCL=${!!sclAsset}`
    );
  }

  // Read B03 (10m native resolution) - this defines our target grid
  const b03Tiff = await openTiff(b03Asset.href);
  const b03Meta = await getTiffMetadata(b03Tiff);
  const epsgCode = b03Meta.geoKeys?.ProjectedCSTypeGeoKey || b03Meta.geoKeys?.GeographicTypeGeoKey;
  
  const b03Image = await b03Tiff.getImage(0);
  
  // Transform bbox from WGS84 to image CRS
  const bboxTransformed = transformBBox(bbox, epsgCode);
  
  // Calculate window from transformed bbox
  const window = calculateWindow(bboxTransformed, b03Meta);
  
  const b03Data = await b03Image.readRasters({
    window: [window.xmin, window.ymin, window.xmax, window.ymax],
    width: window.width,
    height: window.height,
  });

  const b03Grid: Grid = {
    width: window.width,
    height: window.height,
    lon0: b03Meta.originX + window.xmin * b03Meta.resX,
    lat0: b03Meta.originY + window.ymin * b03Meta.resY,
    pxSize: b03Meta.resX,
    data: new Float32Array(b03Data[0] as ArrayLike<number>),
    nodata: -9999,
    epsg: epsgCode, // Store CRS for later coordinate transforms
  };

  // Read B05 (20m native) and resample to 10m
  const b05Tiff = await openTiff(b05Asset.href);
  const b05Meta = await getTiffMetadata(b05Tiff);
  const b05BboxTransformed = transformBBox(bbox, b05Meta.geoKeys?.ProjectedCSTypeGeoKey || b05Meta.geoKeys?.GeographicTypeGeoKey);
  const b05Window = calculateWindow(b05BboxTransformed, b05Meta);
  const b05Image = await b05Tiff.getImage(0);
  const b05Data = await b05Image.readRasters({
    window: [b05Window.xmin, b05Window.ymin, b05Window.xmax, b05Window.ymax],
    width: b05Window.width,
    height: b05Window.height,
  });

  // Resample B05 from 20m to 10m (bilinear)
  const b05Grid = resampleBilinear(
    new Float32Array(b05Data[0] as ArrayLike<number>),
    b05Window.width,
    b05Window.height,
    window.width,
    window.height
  );

  const b05GridFinal: Grid = {
    width: window.width,
    height: window.height,
    lon0: b03Grid.lon0,
    lat0: b03Grid.lat0,
    pxSize: b03Grid.pxSize,
    data: b05Grid,
    nodata: -9999,
    epsg: epsgCode,
  };

  // Read SCL (20m) and resample to 10m (nearest neighbor)
  const sclTiff = await openTiff(sclAsset.href);
  const sclMeta = await getTiffMetadata(sclTiff);
  const sclBboxTransformed = transformBBox(bbox, sclMeta.geoKeys?.ProjectedCSTypeGeoKey || sclMeta.geoKeys?.GeographicTypeGeoKey);
  const sclWindow = calculateWindow(sclBboxTransformed, sclMeta);
  const sclImage = await sclTiff.getImage(0);
  const sclData = await sclImage.readRasters({
    window: [sclWindow.xmin, sclWindow.ymin, sclWindow.xmax, sclWindow.ymax],
    width: sclWindow.width,
    height: sclWindow.height,
  });

  // Resample SCL from 20m to 10m (nearest)
  const sclResampled = resampleNearest(
    new Uint8Array(sclData[0] as ArrayLike<number>),
    sclWindow.width,
    sclWindow.height,
    window.width,
    window.height
  );

  const sclMask: Mask = {
    width: window.width,
    height: window.height,
    lon0: b03Grid.lon0,
    lat0: b03Grid.lat0,
    pxSize: b03Grid.pxSize,
    data: sclResampled,
  };

  console.log(`      ✓ Aligned grids: ${window.width}×${window.height} px`);

  return { b03: b03Grid, b05: b05GridFinal, scl: sclMask };
}

/**
 * Transform bbox from WGS84 to target EPSG
 */
function transformBBox(bbox: BBox, targetEpsg?: number): BBox {
  if (!targetEpsg || targetEpsg === 4326) {
    return bbox; // Already in WGS84
  }

  const [minLon, minLat, maxLon, maxLat] = bbox;
  
  try {
    const [minX, minY] = proj4('EPSG:4326', `EPSG:${targetEpsg}`, [minLon, minLat]);
    const [maxX, maxY] = proj4('EPSG:4326', `EPSG:${targetEpsg}`, [maxLon, maxLat]);
    return [minX, minY, maxX, maxY];
  } catch (error) {
    console.warn(`      ⚠️  Failed to transform bbox to EPSG:${targetEpsg}, using original`);
    return bbox;
  }
}

/**
 * Calculate pixel window from bbox and tiff metadata
 */
function calculateWindow(
  bbox: BBox,
  meta: { originX: number; originY: number; resX: number; resY: number; width: number; height: number }
) {
  const [minLon, minLat, maxLon, maxLat] = bbox;

  // Convert bbox to pixel coords
  // Note: resY is typically negative for north-up images
  const xmin = Math.max(0, Math.floor((minLon - meta.originX) / Math.abs(meta.resX)));
  const ymin = Math.max(0, Math.floor((meta.originY - maxLat) / Math.abs(meta.resY)));
  const xmax = Math.min(meta.width, Math.ceil((maxLon - meta.originX) / Math.abs(meta.resX)));
  const ymax = Math.min(meta.height, Math.ceil((meta.originY - minLat) / Math.abs(meta.resY)));

  const width = Math.max(1, xmax - xmin);
  const height = Math.max(1, ymax - ymin);

  return {
    xmin,
    ymin,
    xmax,
    ymax,
    width,
    height,
  };
}

/**
 * Bilinear resampling
 */
function resampleBilinear(
  input: Float32Array,
  inWidth: number,
  inHeight: number,
  outWidth: number,
  outHeight: number
): Float32Array {
  const output = new Float32Array(outWidth * outHeight);
  const xRatio = inWidth / outWidth;
  const yRatio = inHeight / outHeight;

  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      const srcX = x * xRatio;
      const srcY = y * yRatio;

      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, inWidth - 1);
      const y1 = Math.min(y0 + 1, inHeight - 1);

      const fx = srcX - x0;
      const fy = srcY - y0;

      const v00 = input[y0 * inWidth + x0];
      const v10 = input[y0 * inWidth + x1];
      const v01 = input[y1 * inWidth + x0];
      const v11 = input[y1 * inWidth + x1];

      const top = v00 * (1 - fx) + v10 * fx;
      const bottom = v01 * (1 - fx) + v11 * fx;
      const value = top * (1 - fy) + bottom * fy;

      output[y * outWidth + x] = value;
    }
  }

  return output;
}

/**
 * Nearest neighbor resampling
 */
function resampleNearest(
  input: Uint8Array,
  inWidth: number,
  inHeight: number,
  outWidth: number,
  outHeight: number
): Uint8Array {
  const output = new Uint8Array(outWidth * outHeight);
  const xRatio = inWidth / outWidth;
  const yRatio = inHeight / outHeight;

  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      output[y * outWidth + x] = input[srcY * inWidth + srcX];
    }
  }

  return output;
}

