/**
 * publish_results.ts
 * 1. Upload dated CSV/XLSX to Google Drive.
 * 2. Append records to Google Sheets (date-based tab).
 * 3. Reconcile source vs Drive vs Sheets counts.
 * 4. Record publish_jobs in D1.
 *
 * Requires: GOOGLE_DRIVE_FOLDER_ID, GOOGLE_SHEETS_SPREADSHEET_ID,
 *           plus Google auth credentials in .env.local
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import { google } from 'googleapis';
import { loadEnv, requireEnv, ROOT } from './lib/env.js';
import { getGoogleAuthClient } from './lib/google-auth.js';
import { d1Execute, r2Get } from './lib/cloudflare-api.js';
import { recordsToCsv, getExportFilenames, EXPORT_COLUMNS } from '../src/exportResults.js';
import type { MetricsRecord } from '../src/types.js';

const XLSX = await import('xlsx');

loadEnv();

// ─── Load last export metadata ────────────────────────────────────────────

const metaPath = join(ROOT, 'output/manifests/last_export.json');
if (!existsSync(metaPath)) {
  console.error('last_export.json not found. Run npm run export first.');
  process.exit(1);
}

const exportMeta = JSON.parse(readFileSync(metaPath, 'utf-8')) as {
  export_id: string;
  export_date: string;
  export_batch_id: string;
  record_count: number;
  csv_path: string;
  xlsx_path: string;
};

console.log(`=== Publish Results ===`);
console.log(`Export ID:   ${exportMeta.export_id}`);
console.log(`Export date: ${exportMeta.export_date}`);
console.log(`Records:     ${exportMeta.record_count}\n`);

// ─── Load files from R2 ───────────────────────────────────────────────────

console.log('1. Loading export files from R2...');
const csvText = await r2Get(exportMeta.csv_path);
const xlsxText = await r2Get(exportMeta.xlsx_path);

if (!csvText || !xlsxText) {
  console.error('Could not retrieve export files from R2. Run npm run export first.');
  process.exit(1);
}

const { csv: csvFilename, xlsx: xlsxFilename } = getExportFilenames(exportMeta.export_date);

// ─── Google auth ──────────────────────────────────────────────────────────

const driveAuth = getGoogleAuthClient([
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
]);
const drive = google.drive({ version: 'v3', auth: driveAuth });
const sheets = google.sheets({ version: 'v4', auth: driveAuth });
const folderId = requireEnv('GOOGLE_DRIVE_FOLDER_ID');
const spreadsheetId = requireEnv('GOOGLE_SHEETS_SPREADSHEET_ID');

// ─── Helper: upload a file to Drive ──────────────────────────────────────

async function uploadToDrive(
  filename: string,
  content: string | Buffer,
  mimeType: string,
): Promise<string> {
  // Check for existing file with same name in folder
  const existing = await drive.files.list({
    q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id,name)',
  });
  const existingFile = existing.data.files?.[0];

  if (existingFile?.id) {
    // Update existing file
    const updated = await drive.files.update({
      fileId: existingFile.id,
      media: { mimeType, body: Readable.from([content]) },
      fields: 'id',
    });
    return updated.data.id!;
  }

  const created = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: Readable.from([content]) },
    fields: 'id',
  });
  return created.data.id!;
}

// ─── Upload to Google Drive ───────────────────────────────────────────────

console.log('2. Uploading to Google Drive...');
const driveFileIdCsv = await uploadToDrive(csvFilename, csvText, 'text/csv');
console.log(`  CSV  file id: ${driveFileIdCsv}`);

const xlsxBuffer = Buffer.from(xlsxText, 'binary');
const driveFileIdXlsx = await uploadToDrive(
  xlsxFilename,
  xlsxBuffer,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
);
console.log(`  XLSX file id: ${driveFileIdXlsx}`);

// ─── Append to Google Sheets ──────────────────────────────────────────────

console.log('\n3. Appending to Google Sheets...');

// Use date-based tab name (YYYY-MM-DD) to avoid single-tab infinite append
const tabName = exportMeta.export_date;

// Ensure the sheet tab exists; create it if not
const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
const existingSheets = spreadsheet.data.sheets ?? [];
const tabExists = existingSheets.some((s) => s.properties?.title === tabName);

if (!tabExists) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    },
  });
  // Write header row
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [EXPORT_COLUMNS as unknown as string[]] },
  });
  console.log(`  Created tab: ${tabName}`);
}

// Parse CSV records for Sheets append
const lines = csvText.split('\n');
const dataRows = lines.slice(1).filter((l) => l.trim()).map((line) =>
  line.split(',').map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"')),
);

const appendResult = await sheets.spreadsheets.values.append({
  spreadsheetId,
  range: `'${tabName}'!A1`,
  valueInputOption: 'RAW',
  insertDataOption: 'INSERT_ROWS',
  requestBody: { values: dataRows },
});

const sheetsRowCount = appendResult.data.updates?.updatedRows ?? 0;
console.log(`  Appended ${sheetsRowCount} rows to tab '${tabName}'`);

// ─── Reconcile counts ─────────────────────────────────────────────────────

console.log('\n4. Reconciling record counts...');
const sourceCount = exportMeta.record_count;
const driveRecordCount = dataRows.length;
const reconcileStatus = driveRecordCount === sourceCount && sheetsRowCount === sourceCount
  ? 'ok'
  : 'mismatch';

console.log(`  source:  ${sourceCount}`);
console.log(`  drive:   ${driveRecordCount}`);
console.log(`  sheets:  ${sheetsRowCount}`);
console.log(`  status:  ${reconcileStatus}`);

if (reconcileStatus === 'mismatch') {
  console.warn('\n  [warn] Count mismatch detected. Run npm run backfill-sheets to repair Sheets.');
}

// ─── Register publish_job in D1 ───────────────────────────────────────────

const publishId = `pub_${randomUUID().slice(0, 8)}`;
const now = new Date().toISOString();
await d1Execute([
  {
    sql: `INSERT INTO publish_jobs
            (publish_id, export_id, drive_status, sheets_status,
             drive_file_id_csv, drive_file_id_xlsx,
             source_record_count, drive_record_count, sheets_record_count,
             reconcile_status, verified_at, created_at)
          VALUES (?, ?, 'done', 'done', ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      publishId,
      exportMeta.export_id,
      driveFileIdCsv,
      driveFileIdXlsx,
      sourceCount,
      driveRecordCount,
      sheetsRowCount,
      reconcileStatus,
      now,
      now,
    ],
  },
]);

// Save publish meta for QA step
const publishMeta = {
  publish_id: publishId,
  export_id: exportMeta.export_id,
  export_date: exportMeta.export_date,
  drive_file_id_csv: driveFileIdCsv,
  drive_file_id_xlsx: driveFileIdXlsx,
  source_record_count: sourceCount,
  drive_record_count: driveRecordCount,
  sheets_record_count: sheetsRowCount,
  reconcile_status: reconcileStatus,
  status: reconcileStatus === 'ok' ? 'done' : 'mismatch',
};
const { writeFileSync } = await import('fs');
writeFileSync(
  join(ROOT, 'output/manifests/last_publish.json'),
  JSON.stringify(publishMeta, null, 2),
);

console.log(`\n=== Publish Complete ===`);
console.log(`publish_id:   ${publishId}`);
console.log(`drive CSV id: ${driveFileIdCsv}`);
console.log(`drive XLSX id: ${driveFileIdXlsx}`);
console.log(`Reconcile:    ${reconcileStatus}`);
console.log(`Next step: npm run qa`);
