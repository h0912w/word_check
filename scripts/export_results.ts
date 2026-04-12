/**
 * export_results.ts
 * Reads result NDJSON files from R2 for today's date,
 * builds a dated CSV and XLSX, saves to output/exports/ and uploads to R2.
 *
 * Requires: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN,
 *           CLOUDFLARE_D1_DATABASE_ID, R2_BUCKET_NAME in .env.local
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { loadEnv, ROOT } from './lib/env.js';
import { d1Execute, r2List, r2Get, r2Put } from './lib/cloudflare-api.js';
import { recordsToCsv, getExportFilenames } from '../src/exportResults.js';
import type { MetricsRecord } from '../src/types.js';

// xlsx is a CommonJS package — dynamic import handles ESM interop
const XLSX = await import('xlsx');

loadEnv();

const exportDate = process.argv[2] ?? new Date().toISOString().slice(0, 10);
console.log(`=== Export Results for ${exportDate} ===\n`);

// ─── 1. Collect all result NDJSON files from R2 ───────────────────────────

const prefix = `results/${exportDate}/records/`;
console.log(`1. Listing R2 result files under ${prefix}...`);

const keys = await r2List(prefix);
if (keys.length === 0) {
  console.error(`No result files found in R2 for ${exportDate}. Has the Worker processed shards yet?`);
  process.exit(1);
}
console.log(`  Found ${keys.length} result file(s).`);

const records: MetricsRecord[] = [];
for (const key of keys) {
  const text = await r2Get(key);
  if (!text) {
    console.warn(`  [warn] Empty object: ${key}`);
    continue;
  }
  for (const line of text.split('\n').filter((l) => l.trim())) {
    try {
      records.push(JSON.parse(line) as MetricsRecord);
    } catch {
      console.warn(`  [warn] Could not parse line in ${key}`);
    }
  }
}
console.log(`  Total records: ${records.length}`);

if (records.length === 0) {
  console.error('No records found. Exiting.');
  process.exit(1);
}

// ─── 2. Build CSV ──────────────────────────────────────────────────────────

const exportBatchId = `export_${exportDate}_${randomUUID().slice(0, 8)}`;
// Ensure export_batch_id and export_date are filled
for (const r of records) {
  r.export_date = exportDate;
  r.export_batch_id = exportBatchId;
}

console.log('\n2. Building CSV...');
const csvContent = recordsToCsv(records);

// ─── 3. Build XLSX ─────────────────────────────────────────────────────────

console.log('3. Building XLSX...');
const wsData = [
  Object.keys(records[0]!),
  ...records.map((r) => Object.values(r).map((v) =>
    typeof v === 'object' ? JSON.stringify(v) : v,
  )),
];
const ws = XLSX.utils.aoa_to_sheet(wsData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'keyword_metrics');
const xlsxBuffer: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

// ─── 4. Save locally ──────────────────────────────────────────────────────

const exportDir = join(ROOT, 'output/exports');
if (!existsSync(exportDir)) mkdirSync(exportDir, { recursive: true });

const { csv: csvFilename, xlsx: xlsxFilename } = getExportFilenames(exportDate);
const csvPath = join(exportDir, csvFilename);
const xlsxPath = join(exportDir, xlsxFilename);

writeFileSync(csvPath, csvContent, 'utf-8');
writeFileSync(xlsxPath, xlsxBuffer);
console.log(`  Saved: output/exports/${csvFilename}`);
console.log(`  Saved: output/exports/${xlsxFilename}`);

// ─── 5. Upload to R2 ──────────────────────────────────────────────────────

console.log('\n4. Uploading exports to R2...');
const r2CsvKey = `exports/${exportDate}/${csvFilename}`;
const r2XlsxKey = `exports/${exportDate}/${xlsxFilename}`;
await r2Put(r2CsvKey, csvContent, 'text/csv');
await r2Put(r2XlsxKey, new Uint8Array(xlsxBuffer), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
console.log(`  R2: ${r2CsvKey}`);
console.log(`  R2: ${r2XlsxKey}`);

// ─── 6. Register export job in D1 ─────────────────────────────────────────

const exportId = `exp_${exportDate}_${randomUUID().slice(0, 8)}`;
const now = new Date().toISOString();
await d1Execute([
  {
    sql: `INSERT INTO export_jobs
            (export_id, export_date, export_batch_id, record_count, csv_path, xlsx_path, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'done', ?)`,
    params: [exportId, exportDate, exportBatchId, records.length, r2CsvKey, r2XlsxKey, now],
  },
]);
console.log(`  D1 export_jobs: ${exportId}`);

// Write export metadata for use by publish step
const metaPath = join(ROOT, 'output/manifests/last_export.json');
writeFileSync(
  metaPath,
  JSON.stringify(
    { export_id: exportId, export_date: exportDate, export_batch_id: exportBatchId, record_count: records.length, csv_path: r2CsvKey, xlsx_path: r2XlsxKey },
    null,
    2,
  ),
);

console.log(`\n=== Export Complete ===`);
console.log(`export_id: ${exportId}`);
console.log(`Records:   ${records.length}`);
console.log(`Next step: npm run publish`);
