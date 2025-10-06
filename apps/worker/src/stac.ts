import { BBox, STACItem } from './types';
import { config } from './config';

/**
 * Search STAC catalog for Sentinel-2 L2A scenes
 */
export async function stacSearch(
  bbox: BBox,
  start: string,
  end: string
): Promise<STACItem[]> {
  const endpoint = `${config.stac.endpoint}/search`;

  const body = {
    collections: ['sentinel-2-l2a'],
    bbox,
    datetime: `${start}T00:00:00Z/${end}T23:59:59Z`,
    limit: 100,
    sortby: [
      {
        field: 'properties.eo:cloud_cover',
        direction: 'asc',
      },
    ],
  };

  console.log(`🛰️  STAC search: ${start}/${end}`);
  console.log(`   Endpoint: ${endpoint}`);

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Bloomium-Worker/0.1.0',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ⚠️  HTTP ${response.status}: ${errorText}`);
        
        if (response.status === 429 || response.status >= 500) {
          // Retry on rate limit or server error
          attempts++;
          const delay = Math.pow(2, attempts) * 1000;
          console.log(`   ⚠️  Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`STAC search failed: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = (await response.json()) as { features?: STACItem[] };
      const items = data.features || [];

      console.log(`   ✓ Found ${items.length} scenes`);

      // Return top N scenes by cloud cover
      const selected = items.slice(0, config.processing.maxScenesPerWeek);
      if (selected.length > 0) {
        console.log(
          `   → Selected ${selected.length} scenes (cloud cover: ${selected
            .map((s: STACItem) => s.properties['eo:cloud_cover']?.toFixed(1) || '?')
            .join('%, ')}%)`
        );
      }

      return selected;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
      const delay = Math.pow(2, attempts) * 1000;
      console.log(`   ⚠️  Error: ${error}, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return [];
}

/**
 * Calculate average cloud cover from scenes
 */
export function getAverageCloudCover(items: STACItem[]): number {
  if (items.length === 0) return 100;
  const sum = items.reduce((acc, item) => acc + (item.properties['eo:cloud_cover'] || 0), 0);
  return sum / items.length;
}

