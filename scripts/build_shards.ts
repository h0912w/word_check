import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { loadEnv, ROOT } from './lib/env.js';
import type { ShardManifest } from '../src/types.js';

loadEnv();

interface RuntimeLimits {
  initialBatchSize: number;
}

const limitsPath = join(ROOT, 'config/runtime-limits.json');
const limits: RuntimeLimits = JSON.parse(readFileSync(limitsPath, 'utf-8'));
const SHARD_SIZE = limits.initialBatchSize;

const manifestDir = join(ROOT, 'output/manifests');
const shardsDir = join(ROOT, 'output/shards');
const preparedDir = join(ROOT, 'output/prepared');

if (!existsSync(shardsDir)) mkdirSync(shardsDir, { recursive: true });

// Load batch meta
const batchMetaPath = join(manifestDir, 'current_batch.json');
if (!existsSync(batchMetaPath)) {
  console.error('current_batch.json not found. Run npm run prepare-input first.');
  process.exit(1);
}
const batchMeta = JSON.parse(readFileSync(batchMetaPath, 'utf-8')) as {
  input_batch_id: string;
};
const { input_batch_id: inputBatchId } = batchMeta;

// Load normalized words
const normalizedPath = join(preparedDir, 'normalized_words.txt');
if (!existsSync(normalizedPath)) {
  console.error('normalized_words.txt not found. Run npm run prepare-input first.');
  process.exit(1);
}

const words = readFileSync(normalizedPath, 'utf-8')
  .split('\n')
  .map((w) => w.trim())
  .filter((w) => w.length > 0);

console.log(`Building shards of size ${SHARD_SIZE} for ${words.length} words...`);

const manifest: ShardManifest = {
  input_batch_id: inputBatchId,
  created_at: new Date().toISOString(),
  shards: [],
};

let shardIndex = 0;
for (let i = 0; i < words.length; i += SHARD_SIZE) {
  const chunk = words.slice(i, i + SHARD_SIZE);
  const shardId = `shard_${String(shardIndex + 1).padStart(6, '0')}`;
  const shardContent = chunk.join('\n');
  const checksum = createHash('sha256').update(shardContent).digest('hex');
  const filePath = join(shardsDir, `${shardId}.txt`);

  writeFileSync(filePath, shardContent, 'utf-8');

  manifest.shards.push({
    shard_id: shardId,
    file_path: `output/shards/${shardId}.txt`,
    row_count: chunk.length,
    checksum,
  });

  console.log(`  [${shardId}] ${chunk.length} words — checksum: ${checksum.slice(0, 12)}...`);
  shardIndex++;
}

// Write shard manifest
const manifestPath = join(manifestDir, 'shard_manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`\nCreated ${manifest.shards.length} shards.`);
console.log(`Shard manifest: output/manifests/shard_manifest.json`);
console.log(`Next step: npm run bootstrap-storage`);
