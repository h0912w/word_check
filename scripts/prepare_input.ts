import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';
import { loadEnv, ROOT } from './lib/env.js';

loadEnv();

function parseInputFile(filePath: string): string[] {
  const ext = extname(filePath).toLowerCase();
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  if (ext === '.csv') {
    return lines
      .map((line) => {
        const first = line.split(',')[0] ?? '';
        return first.replace(/^["']|["']$/g, '').trim();
      })
      .filter((w) => w.length > 0);
  }

  // .txt: one word per line
  return lines.map((w) => w.trim()).filter((w) => w.length > 0);
}

const inputDir = join(ROOT, 'input');
const preparedDir = join(ROOT, 'output/prepared');
const manifestDir = join(ROOT, 'output/manifests');

if (!existsSync(preparedDir)) mkdirSync(preparedDir, { recursive: true });
if (!existsSync(manifestDir)) mkdirSync(manifestDir, { recursive: true });

const files = readdirSync(inputDir).filter((f) =>
  ['.txt', '.csv'].includes(extname(f).toLowerCase()),
);

if (files.length === 0) {
  console.error('No input files found in input/. Add .txt or .csv files.');
  process.exit(1);
}

const inputBatchId = `batch_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
console.log(`Input batch ID: ${inputBatchId}`);

const allWords: string[] = [];
for (const file of files) {
  const words = parseInputFile(join(inputDir, file));
  console.log(`  Parsed ${words.length} words from ${file}`);
  for (const w of words) allWords.push(w);
}

// Preserve input order; remove only blank lines (not duplicates, per contract default)
const normalized = allWords.filter((w) => w.length > 0);

const outPath = join(preparedDir, 'normalized_words.txt');
writeFileSync(outPath, normalized.join('\n'), 'utf-8');

const checksum = createHash('sha256').update(normalized.join('\n')).digest('hex');

const batchMeta = {
  input_batch_id: inputBatchId,
  word_count: normalized.length,
  checksum,
  created_at: new Date().toISOString(),
};
writeFileSync(join(manifestDir, 'current_batch.json'), JSON.stringify(batchMeta, null, 2));

console.log(`\nWrote ${normalized.length} words to ${outPath}`);
console.log(`Batch meta saved to output/manifests/current_batch.json`);
console.log(`Next step: npm run build-shards`);
