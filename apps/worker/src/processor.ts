import { AOIInput, MetaData, TimeseriesPoint } from './types';
import { TileGenerator } from './tile-generator';
import { StorageWriter } from './storage';

export class AOIProcessor {
  private tileGenerator: TileGenerator;
  private storage: StorageWriter;

  constructor() {
    this.tileGenerator = new TileGenerator();
    this.storage = new StorageWriter();
  }

  /**
   * Process an AOI: generate tiles and metadata for all dates
   */
  async process(aoi: AOIInput): Promise<void> {
    console.log(`\n🪷 Processing AOI: ${aoi.aoi_id}`);
    console.log(`   Bbox: ${aoi.bbox.join(', ')}`);
    console.log(`   Dates: ${aoi.dates.length}`);

    for (const date of aoi.dates) {
      await this.processDate(aoi, date);
    }

    console.log(`\n✅ Completed processing ${aoi.aoi_id}`);
  }

  /**
   * Process a single date for an AOI
   */
  private async processDate(aoi: AOIInput, date: string): Promise<void> {
    console.log(`\n📅 Processing date: ${date}`);

    const zoomLevels = [5, 6, 7]; // Generate tiles at these zoom levels
    let totalTiles = 0;

    for (const zoom of zoomLevels) {
      const tiles = this.tileGenerator.getTilesForBBox(aoi.bbox, zoom);
      console.log(`   Zoom ${zoom}: ${tiles.length} tiles`);

      for (const coord of tiles) {
        // Generate bloom tile
        const bloomTile = await this.tileGenerator.generateBloomTile(coord, date);
        await this.storage.writeTile(aoi.aoi_id, date, 'bloom', coord.z, coord.x, coord.y, bloomTile);

        // Generate anomaly tile
        const anomalyTile = await this.tileGenerator.generateAnomalyTile(coord, date);
        await this.storage.writeTile(aoi.aoi_id, date, 'anomaly', coord.z, coord.x, coord.y, anomalyTile);

        totalTiles++;
      }
    }

    // Generate metadata
    const meta: MetaData = {
      aoi_id: aoi.aoi_id,
      date,
      bbox: aoi.bbox,
      tile_count: totalTiles,
      generated_at: new Date().toISOString(),
      zoom_levels: zoomLevels,
    };

    await this.storage.writeJSON(aoi.aoi_id, date, 'meta.json', meta);

    // Generate mock timeseries data
    const timeseries: TimeseriesPoint[] = this.generateTimeseriesData(date);
    await this.storage.writeJSON(aoi.aoi_id, date, 'timeseries.json', timeseries);

    console.log(`   ✓ Generated ${totalTiles} tiles + metadata`);
  }

  /**
   * Generate mock timeseries data
   */
  private generateTimeseriesData(currentDate: string): TimeseriesPoint[] {
    const data: TimeseriesPoint[] = [];
    const current = new Date(currentDate);

    // Generate 8 weeks of data (current + 7 previous weeks)
    for (let i = 7; i >= 0; i--) {
      const date = new Date(current);
      date.setDate(date.getDate() - i * 7);

      const phase = i / 7;
      const ari = 0.1 + Math.sin(phase * Math.PI) * 0.15;
      const ndvi = 0.6 + Math.cos(phase * Math.PI) * 0.2;
      const bloom_probability = Math.max(0, Math.min(1, Math.sin(phase * Math.PI * 1.5)));

      data.push({
        date: date.toISOString().split('T')[0],
        ari: parseFloat(ari.toFixed(4)),
        ndvi: parseFloat(ndvi.toFixed(4)),
        bloom_probability: parseFloat(bloom_probability.toFixed(4)),
      });
    }

    return data;
  }
}

