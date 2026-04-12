/**
 * bootstrap_storage.ts
 * 1. Create D1 tables (idempotent via IF NOT EXISTS).
 * 2. Upload input shards to R2.
 * 3. Register input_batch + shards in D1.
 *
 * Requires: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN,
 *           CLOUDFLARE_D1_DATABASE_ID, R2_BUCKET_NAME in .env.local
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { loadEnv, ROOT } from './lib/env.js';
import { d1Execute, r2Put } from './lib/cloudflare-api.js';
import type { ShardManifest } from '../src/types.js';

loadEnv();

const manifestPath = join(ROOT, 'output/manifests/shard_manifest.json');
if (!existsSync(manifestPath)) {
  console.error('shard_manifest.json not found. Run npm run build-shards first.');
  process.exit(1);
}

const manifest: ShardManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const { input_batch_id: inputBatchId, shards } = manifest;

console.log(`=== Bootstrap Storage ===`);
console.log(`Batch: ${inputBatchId}  |  Shards: ${shards.length}\n`);

// ─── 1. Create D1 tables ────────────────────────────────────────────────────

console.log('1. Creating D1 tables (if not exist)...');

const schemaPath = join(ROOT, 'config/d1-schema.sql');
if (!existsSync(schemaPath)) {
  console.error('config/d1-schema.sql not found.');
  process.exit(1);
}

const schemaSql = readFileSync(schemaPath, 'utf-8');
const statements = schemaSql
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0)
  .map((sql) => ({ sql: sql + ';' }));

await d1Execute(statements);
console.log('  D1 tables ready.');

// ─── 2. Register input_batch ───────────────────────────────────────────────

console.log('\n2. Registering input_batch in D1...');
await d1Execute([
  {
    sql: `INSERT OR IGNORE INTO input_batches (input_batch_id, word_count, created_at)
          VALUES (?, ?, ?)`,
    params: [inputBatchId, shards.reduce((sum, s) => sum + s.row_count, 0), manifest.created_at],
  },
]);
console.log(`  Registered batch: ${inputBatchId}`);

// ─── 3. Upload shards to R2 and register in D1 ────────────────────────────

console.log('\n3. Uploading shards to R2 and registering in D1...');

for (const shard of shards) {
  const localPath = join(ROOT, shard.file_path);
  if (!existsSync(localPath)) {
    console.error(`  [error] Shard file not found: ${shard.file_path}`);
    process.exit(1);
  }

  const content = readFileSync(localPath, 'utf-8');
  const r2Key = `inputs/${inputBatchId}/shards/${shard.shard_id}.txt`;

  // Upload to R2
  await r2Put(r2Key, content, 'text/plain');
  console.log(`  [r2]  uploaded ${r2Key}`);

  // Register in D1
  const now = new Date().toISOString();
  await d1Execute([
    {
      sql: `INSERT OR IGNORE INTO shards
              (shard_id, input_batch_id, file_path, row_count, checksum, status, retry_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
      params: [
        shard.shard_id,
        inputBatchId,
        r2Key,
        shard.row_count,
        shard.checksum,
        now,
        now,
      ],
    },
  ]);
  console.log(`  [d1]  registered ${shard.shard_id} as pending`);
}

console.log('\n=== Bootstrap Storage Complete ===');
console.log(`${shards.length} shards uploaded to R2 and registered in D1.`);
console.log(`The Cloudflare Worker Cron will now process them automatically.`);
console.log(`After processing completes: npm run export`);
