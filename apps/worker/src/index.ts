#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { AOIInput } from './types';
import { AOIProcessor } from './processor';

const program = new Command();

program
  .name('bloomium-worker')
  .description('Bloomium tile generator worker')
  .version('0.1.0')
  .option('--aoi <path>', 'Path to AOI JSON file')
  .option('--aoi-id <id>', 'AOI ID (for cloud mode)')
  .parse();

const options = program.opts();

async function main() {
  console.log('🪷 Bloomium Worker');
  console.log('=================\n');

  if (!options.aoi) {
    console.error('Error: --aoi option is required');
    console.log('\nUsage:');
    console.log('  pnpm dev -- --aoi ./fixtures/demo-aoi-1.json');
    process.exit(1);
  }

  // Load AOI configuration
  const aoiPath = path.resolve(process.cwd(), options.aoi);
  console.log(`Loading AOI from: ${aoiPath}\n`);

  let aoi: AOIInput;
  try {
    const content = await fs.readFile(aoiPath, 'utf-8');
    aoi = JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load AOI file: ${error}`);
    process.exit(1);
  }

  // Process AOI
  const processor = new AOIProcessor();
  try {
    await processor.process(aoi);
  } catch (error) {
    console.error(`Processing failed: ${error}`);
    process.exit(1);
  }
}

main();

