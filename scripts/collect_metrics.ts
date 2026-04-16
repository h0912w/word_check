#!/usr/bin/env tsx

/**
 * Collect Metrics Script
 *
 * Local execution script for collecting Google Ads keyword metrics.
 * Replaces Cloudflare Workers with local Node.js execution.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import { createLocalAdsClient } from '../src/ads-api/local-client.js';
import { createMockAdsClient } from '../src/ads-api/mock-client.js';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

interface CollectMetricsOptions {
  batchSize?: number;
  dryRun?: boolean;
}

/**
 * Main function to collect metrics
 */
async function collectMetrics(options: CollectMetricsOptions = {}): Promise<void> {
  // Read BATCH_SIZE from environment variable
  const envBatchSize = parseInt(process.env.BATCH_SIZE || '10', 10);
  const { batchSize = envBatchSize, dryRun = false } = options;

  console.log('='.repeat(60));
  console.log('Word Check - Collect Metrics (Local Execution)');
  console.log('='.repeat(60));
  console.log(`Batch size: ${batchSize}`);
  console.log(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
  console.log('');

  // Initialize SQLite database
  const SQL = await initSqlJs();
  const dbPath = path.join(PROJECT_ROOT, 'data/word-check.db');

  if (!fs.existsSync(dbPath)) {
    console.error('Database not found. Run npm run init-db first.');
    return;
  }

  const dbData = fs.readFileSync(dbPath);
  const db = new SQL.Database(dbData);

  // Load manifest and insert shards into DB if needed
  const manifestPath = path.join(PROJECT_ROOT, 'output/manifests/shard_manifest.json');
  if (fs.existsSync(manifestPath)) {
    console.log('Loading manifest file...');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    console.log(`Manifest found: ${manifest.total_shards} shards, ${manifest.total_rows} total rows`);

    // Check if shards already exist in DB
    const existingShards = db.exec('SELECT shard_id FROM shards');
    const existingShardIds = new Set<string>();
    if (existingShards.length > 0) {
      for (const row of existingShards[0].values) {
        existingShardIds.add(row[0] as string);
      }
    }

    // Insert new shards from manifest
    let insertedCount = 0;
    for (const shard of manifest.shards) {
      if (!existingShardIds.has(shard.shard_id)) {
        db.run(
          `INSERT INTO shards (shard_id, file_path, total_rows, current_offset, status, retry_count, input_batch_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            shard.shard_id,
            shard.file_path,
            shard.row_count,
            0,
            'pending',
            0,
            manifest.input_batch_id,
            new Date().toISOString()
          ]
        );
        insertedCount++;
      }
    }

    if (insertedCount > 0) {
      console.log(`Inserted ${insertedCount} shards into database`);
      // Save DB state after inserting shards
      const updatedData = db.export();
      fs.writeFileSync(dbPath, updatedData);
    }
  }

  // Find pending or retry shards
  // Calculate max shards based on budget: each shard (100 words) needs 5 API calls with BATCH_SIZE=20
  const adsBudget = parseInt(process.env.FREE_TIER_ADS_BUDGET || '1000', 10);
  const apiBatchSize = parseInt(process.env.BATCH_SIZE || '10', 10);
  const maxShardsPerRun = Math.floor(adsBudget / (100 / apiBatchSize)); // 100 words per shard / batchSize
  const safeMaxShards = Math.max(1, Math.min(maxShardsPerRun, 100)); // Cap at 100 shards per run

  console.log(`Max shards per run: ${safeMaxShards} (budget: ${adsBudget}, batch: ${apiBatchSize})`);

  const shardsResult = db.exec(
    `SELECT shard_id, file_path, total_rows, current_offset, retry_count, status, input_batch_id FROM shards WHERE status IN ("pending", "retry") ORDER BY shard_id LIMIT ${safeMaxShards}`
  );

  const shards: any[] = [];
  if (shardsResult.length > 0) {
    const columns = shardsResult[0].columns;
    const values = shardsResult[0].values;
    for (const row of values) {
      const shard: any = {};
      columns.forEach((col, i) => {
        shard[col] = row[i];
      });
      shards.push(shard);
    }
  }

  if (shards.length === 0) {
    console.log('No pending or retry shards found');
    console.log('Tip: Run "npm run prepare-input" and "npm run build-shards" first');
    db.close();
    return;
  }

  console.log(`Found ${shards.length} shards to process`);
  console.log('');

  // Create Google Ads client (use mock if USE_MOCK_API is set)
  const useMockApi = process.env.USE_MOCK_API === 'true';
  if (useMockApi) {
    console.log('Using MOCK API client (for testing)');
  }
  const adsClient = useMockApi
    ? createMockAdsClient(process.env as Record<string, string>)
    : createLocalAdsClient(process.env as Record<string, string>);

  // Process each shard - completely process each shard before moving to next
  for (const shard of shards) {
    const shardId = shard.shard_id;
    let currentOffset = shard.current_offset || 0;
    const totalRows = shard.total_rows;
    let shardComplete = false;

    console.log(`Starting shard ${shardId} (${totalRows} total rows)`);

    // Keep processing this shard until complete
    while (!shardComplete) {
      console.log(`Processing shard ${shardId} from offset ${currentOffset}`);

      // Update shard status to running
      db.run('UPDATE shards SET status = ?, last_run_at = ? WHERE shard_id = ?', ['running', new Date().toISOString(), shardId]);

      // Calculate batch size
      const remainingRows = totalRows - currentOffset;
      const actualBatchSize = Math.min(batchSize, remainingRows);

      // Load keywords from shard file
      const keywords = await loadKeywordsFromShard(shardId, currentOffset, actualBatchSize);

      if (keywords.length === 0) {
        console.log(`No keywords to process in shard ${shardId}`);
        shardComplete = true;
        if (currentOffset >= totalRows) {
          db.prepare('UPDATE shards SET status = ?, completed_at = ? WHERE shard_id = ?')
            .run('done', new Date().toISOString(), shardId);
        }
        continue;
      }

      if (dryRun) {
        console.log(`[DRY RUN] Would fetch metrics for ${keywords.length} keywords`);
        console.log(`  Keywords: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}`);
        currentOffset += actualBatchSize;
        if (currentOffset >= totalRows) shardComplete = true;
        continue;
      }

      try {
        // Fetch metrics from Google Ads
        const records = await adsClient.fetchHistoricalMetrics(keywords);

        console.log(`Fetched ${records.length} metrics records`);

        // Save results to SQLite
        let savedCount = 0;
        for (const record of records) {
          const rowKey = `${record.collected_at.split('T')[0]}|${shard.input_batch_id}|${shardId}|${currentOffset + savedCount}|${record.word}`;

          try {
            db.run(
              `INSERT OR REPLACE INTO keyword_results (
                row_key, word, avg_monthly_searches, competition, competition_index,
                monthly_searches_raw, collected_at, api_status, source_shard,
                source_offset, input_batch_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                rowKey,
                record.word,
                record.avg_monthly_searches,
                record.competition,
                record.competition_index,
                JSON.stringify(record.monthly_searches_raw),
                record.collected_at,
                record.api_status,
                shardId,
                currentOffset + savedCount,
                shard.input_batch_id
              ]
            );
            savedCount++;
          } catch (error) {
            console.error(`Failed to save record for ${record.word}:`, error);
          }
        }

        console.log(`Saved ${savedCount} records to database`);

        // Update offset
        const newOffset = currentOffset + actualBatchSize;
        db.run('UPDATE shards SET current_offset = ? WHERE shard_id = ?', [newOffset, shardId]);
        currentOffset = newOffset;

        // Mark as done if complete
        if (newOffset >= totalRows) {
          db.run('UPDATE shards SET status = ?, completed_at = ? WHERE shard_id = ?', ['done', new Date().toISOString(), shardId]);
          console.log(`Shard ${shardId} completed`);
          shardComplete = true;
        } else {
          console.log(`Shard ${shardId} progress: ${newOffset}/${totalRows}`);
        }

        // Save DB state after each batch
        const updatedData = db.export();
        fs.writeFileSync(dbPath, updatedData);
      } catch (error) {
        console.error(`Failed to process shard ${shardId}:`, error);

        // Update shard status to retry or failed
        const retryCount = shard.retry_count || 0;
        const maxRetryCount = parseInt(process.env.MAX_RETRY_COUNT || '3', 10);

        if (retryCount < maxRetryCount) {
          db.run('UPDATE shards SET status = ?, retry_count = ? WHERE shard_id = ?', ['retry', retryCount + 1, shardId]);
          console.log(`Shard ${shardId} marked for retry (${retryCount + 1}/${maxRetryCount})`);
        } else {
          db.run('UPDATE shards SET status = ? WHERE shard_id = ?', ['failed', shardId]);
          console.log(`Shard ${shardId} marked as failed after ${maxRetryCount} retries`);
        }

        // Save DB state after error
        const updatedData = db.export();
        fs.writeFileSync(dbPath, updatedData);
        shardComplete = true; // Exit loop on error
      }
    }
  }

  db.close();
  console.log('');
  console.log('='.repeat(60));
  console.log('Collect metrics completed');
  console.log('='.repeat(60));
}

/**
 * Load keywords from a shard file
 */
async function loadKeywordsFromShard(
  shardId: string,
  offset: number,
  batchSize: number
): Promise<string[]> {
  let shardPath = path.join(PROJECT_ROOT, `output/shards/${shardId}.txt`);

  // Check if absolute path is stored in DB
  const dbPath = path.join(PROJECT_ROOT, 'data/word-check.db');
  if (fs.existsSync(dbPath)) {
    const SQL = await initSqlJs();
    const dbData = fs.readFileSync(dbPath);
    const db = new SQL.Database(dbData);
    const shardResult = db.exec(`SELECT file_path FROM shards WHERE shard_id = '${shardId}'`);
    db.close();

    if (shardResult.length > 0 && shardResult[0].values.length > 0) {
      const storedPath = shardResult[0].values[0][0] as string;
      if (storedPath && path.isAbsolute(storedPath)) {
        shardPath = storedPath;
      }
    }
  }

  if (!fs.existsSync(shardPath)) {
    console.error(`Shard file not found: ${shardPath}`);
    return [];
  }

  const shardContent = fs.readFileSync(shardPath, 'utf-8');

  // Split by lines and filter empty lines
  const allKeywords = shardContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Return keywords from offset to offset + batchSize
  return allKeywords.slice(offset, offset + batchSize);
}

/**
 * Parse command line arguments
 */
function parseArgs(): CollectMetricsOptions {
  const args = process.argv.slice(2);
  const options: CollectMetricsOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--batch-size':
      case '-b':
        options.batchSize = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: npm run collect-metrics [options]

Options:
  --batch-size, -b   Number of keywords per batch (default: 10)
  --dry-run          Show what would be done without executing
  --help, -h         Show this help message

Examples:
  npm run collect-metrics
  npm run collect-metrics -- --batch-size 20
  npm run collect-metrics -- --dry-run
        `);
        process.exit(0);
    }
  }

  return options;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();
    await collectMetrics(options);
  } catch (error) {
    console.error('Collect metrics failed:', error);
    process.exit(1);
  }
}

main();
