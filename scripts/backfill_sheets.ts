/**
 * backfill_sheets.ts
 * Uses R2 as source of truth to detect and fill missing rows in Google Sheets
 * by comparing row_key values.
 *
 * Requires: GOOGLE_SHEETS_SPREADSHEET_ID, Google auth, Cloudflare credentials in .env.local
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';
import { loadEnv, requireEnv, ROOT } from './lib/env.js';
import { getGoogleAuthClient } from './lib/google-auth.js';
import { r2List, r2Get } from './lib/cloudflare-api.js';
import { EXPORT_COLUMNS } from '../src/exportResults.js';
import type { MetricsRecord } from '../src/types.js';

loadEnv();

const publishMetaPath = join(ROOT, 'output/manifests/last_publish.json');
if (!existsSync(publishMetaPath)) {
  console.error('last_publish.json not found. Run npm run publish first.');
  process.exit(1);
}

const publishMeta = JSON.parse(readFileSync(publishMetaPath, 'utf-8')) as {
  export_date: string;
};
const exportDate = process.argv[2] ?? publishMeta.export_date;

console.log(`=== Backfill Sheets for ${exportDate} ===\n`);

const spreadsheetId = requireEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
const sheetsAuth = getGoogleAuthClient([
  'https://www.googleapis.com/auth/spreadsheets',
]);
const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });
const tabName = exportDate;

// ─── 1. Fetch existing row_keys from Sheets ──────────────────────────────

console.log(`1. Reading existing rows from Sheets tab '${tabName}'...`);
let existingRowKeys = new Set<string>();

try {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tabName}'!A:N`,  // columns A through N = 14 columns
  });
  const rows = response.data.values ?? [];
  const headerRow = rows[0];
  if (headerRow) {
    const rowKeyIdx = headerRow.indexOf('row_key');
    if (rowKeyIdx !== -1) {
      for (const row of rows.slice(1)) {
        const rk = row[rowKeyIdx];
        if (rk) existingRowKeys.add(rk as string);
      }
    }
  }
  console.log(`  Found ${existingRowKeys.size} existing row_keys in Sheets.`);
} catch {
  console.warn('  Tab not found or empty — will create and backfill all records.');
}

// ─── 2. Load R2 source records ────────────────────────────────────────────

console.log('\n2. Loading R2 source records...');
const r2Keys = await r2List(`results/${exportDate}/records/`);

const allRecords: MetricsRecord[] = [];
for (const key of r2Keys) {
  const text = await r2Get(key);
  if (!text) continue;
  for (const line of text.split('\n').filter((l) => l.trim())) {
    try {
      allRecords.push(JSON.parse(line) as MetricsRecord);
    } catch {
      console.warn(`  [warn] Could not parse line in ${key}`);
    }
  }
}
console.log(`  R2 source records: ${allRecords.length}`);

// ─── 3. Find missing rows ─────────────────────────────────────────────────

const missing = allRecords.filter((r) => !existingRowKeys.has(r.row_key));
console.log(`\n3. Missing rows: ${missing.length}`);

if (missing.length === 0) {
  console.log('No missing rows. Sheets is up to date.');
  process.exit(0);
}

// ─── 4. Append missing rows ───────────────────────────────────────────────

console.log(`\n4. Appending ${missing.length} missing rows to tab '${tabName}'...`);

// Ensure tab exists
const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
const tabExists = (spreadsheet.data.sheets ?? []).some(
  (s) => s.properties?.title === tabName,
);

if (!tabExists) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [EXPORT_COLUMNS as unknown as string[]] },
  });
}

const rowsToAppend = missing.map((r) =>
  EXPORT_COLUMNS.map((col) => {
    const v = (r as Record<string, unknown>)[col];
    return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  }),
);

await sheets.spreadsheets.values.append({
  spreadsheetId,
  range: `'${tabName}'!A1`,
  valueInputOption: 'RAW',
  insertDataOption: 'INSERT_ROWS',
  requestBody: { values: rowsToAppend },
});

console.log(`  Appended ${missing.length} rows.`);
console.log('\n=== Backfill Complete ===');
