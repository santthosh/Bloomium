#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs-extra';
import path from 'path';
import { AOIInput, RunJobInput } from './types';
import { runJob } from './job';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('aoi', {
      type: 'string',
      demandOption: true,
      describe: 'Path to AOI JSON file',
    })
    .option('dates', {
      type: 'string',
      describe: 'Comma-separated list of dates (YYYY-MM-DD)',
    })
    .option('start', {
      type: 'string',
      describe: 'Start date (YYYY-MM-DD)',
    })
    .option('end', {
      type: 'string',
      describe: 'End date (YYYY-MM-DD)',
    })
    .option('force', {
      type: 'boolean',
      default: false,
      describe: 'Force reprocessing even if tiles exist',
    })
    .example('$0 --aoi fixtures/demo-aoi.json --dates 2025-09-01,2025-09-08', 'Process specific dates')
    .example('$0 --aoi fixtures/demo-aoi.json --force', 'Reprocess all dates in AOI file')
    .help()
    .alias('help', 'h')
    .version('0.1.0')
    .parseAsync();

  console.log('🪷 Bloomium Worker - Real Satellite Data');
  console.log('=========================================\n');

  // Load AOI configuration
  const aoiPath = path.resolve(process.cwd(), argv.aoi);
  
  if (!(await fs.pathExists(aoiPath))) {
    console.error(`❌ AOI file not found: ${aoiPath}`);
    process.exit(1);
  }

  console.log(`📂 Loading AOI from: ${aoiPath}\n`);

  let aoi: AOIInput;
  try {
    aoi = await fs.readJSON(aoiPath);
  } catch (error) {
    console.error(`❌ Failed to parse AOI file: ${error}`);
    process.exit(1);
  }

  // Build input with overrides
  const input: RunJobInput = {
    ...aoi,
    force: argv.force,
  };

  // Override dates if specified
  if (argv.dates) {
    input.dates = argv.dates.split(',').map((d) => d.trim());
  }

  // Validate
  if (!input.aoi_id || !input.bbox || !input.dates || input.dates.length === 0) {
    console.error('❌ Invalid AOI file: must have aoi_id, bbox, and dates');
    process.exit(1);
  }

  // Run job
  try {
    await runJob(input);
  } catch (error) {
    console.error(`\n❌ Job failed: ${error}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

