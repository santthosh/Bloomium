import { Firestore } from '@google-cloud/firestore';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config, isLocalMode } from '../config';
import { AOI } from '../types';

class AOIService {
  private firestore: Firestore | null = null;
  private localAOIPath: string;

  constructor() {
    if (!isLocalMode()) {
      this.firestore = new Firestore({
        projectId: config.gcs.projectId,
      });
    }
    this.localAOIPath = path.join(process.cwd(), config.storagePath, 'aois.json');
  }

  /**
   * Resolve AOI from name or bbox
   */
  async resolveAOI(name?: string, bbox?: [number, number, number, number]): Promise<string> {
    if (name) {
      // Try to find existing AOI by name
      const existing = await this.findByName(name);
      if (existing) return existing.aoi_id;
    }

    // Generate new AOI ID
    const aoi_id = this.generateAOIId(name, bbox);
    
    // Store AOI metadata
    const aoi: AOI = {
      aoi_id,
      name,
      bbox: bbox || [-121.5, 38.2, -121.0, 38.6], // Default to demo bbox
      dates: [],
    };

    await this.save(aoi);
    return aoi_id;
  }

  /**
   * Find AOI by name
   */
  private async findByName(name: string): Promise<AOI | null> {
    if (isLocalMode()) {
      try {
        const content = await fs.readFile(this.localAOIPath, 'utf-8');
        const aois: AOI[] = JSON.parse(content);
        return aois.find(a => a.name === name) || null;
      } catch {
        return null;
      }
    } else {
      const snapshot = await this.firestore!
        .collection(config.firestore.collections.aois)
        .where('name', '==', name)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as AOI;
    }
  }

  /**
   * Save AOI
   */
  private async save(aoi: AOI): Promise<void> {
    if (isLocalMode()) {
      let aois: AOI[] = [];
      try {
        const content = await fs.readFile(this.localAOIPath, 'utf-8');
        aois = JSON.parse(content);
      } catch {
        // File doesn't exist yet
        await fs.mkdir(path.dirname(this.localAOIPath), { recursive: true });
      }
      
      aois.push(aoi);
      await fs.writeFile(this.localAOIPath, JSON.stringify(aois, null, 2));
    } else {
      await this.firestore!
        .collection(config.firestore.collections.aois)
        .doc(aoi.aoi_id)
        .set(aoi);
    }
  }

  /**
   * Generate AOI ID
   */
  private generateAOIId(name?: string, bbox?: [number, number, number, number]): string {
    const hash = crypto.createHash('md5');
    hash.update(name || '');
    hash.update(JSON.stringify(bbox || []));
    hash.update(Date.now().toString());
    return hash.digest('hex').substring(0, 12);
  }

  /**
   * Get AOI by ID
   */
  async getById(aoi_id: string): Promise<AOI | null> {
    if (isLocalMode()) {
      try {
        const content = await fs.readFile(this.localAOIPath, 'utf-8');
        const aois: AOI[] = JSON.parse(content);
        return aois.find(a => a.aoi_id === aoi_id) || null;
      } catch {
        return null;
      }
    } else {
      const doc = await this.firestore!
        .collection(config.firestore.collections.aois)
        .doc(aoi_id)
        .get();
      
      return doc.exists ? (doc.data() as AOI) : null;
    }
  }
}

export const aoiService = new AOIService();

