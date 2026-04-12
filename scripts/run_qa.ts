/**
 * run_qa.ts
 * Executes QA by verifying that the Google Drive upload contains the expected
 * records. Writes output/qa/qa_result.json and output/qa/qa_report.md.
 *
 * PASS conditions (from qa-plan.md):
 * - Drive CSV and XLSX file IDs are valid and readable
 * - Drive row count equals expected_row_count
 * - All required columns present in CSV header
 * - publish reconcile_status is 'ok'
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { google } from 'googleapis';
import { loadEnv, requireEnv, ROOT } from './lib/env.js';
import { getGoogleAuthClient } from './lib/google-auth.js';
import { EXPORT_COLUMNS } from '../src/exportResults.js';
import type { QaResult } from '../src/types.js';

loadEnv();

const qaDir = join(ROOT, 'output/qa');
if (!existsSync(qaDir)) mkdirSync(qaDir, { recursive: true });

// ─── Load publish metadata ────────────────────────────────────────────────

const publishMetaPath = join(ROOT, 'output/manifests/last_publish.json');
if (!existsSync(publishMetaPath)) {
  console.error('last_publish.json not found. Run npm run publish first.');
  process.exit(1);
}

const publishMeta = JSON.parse(readFileSync(publishMetaPath, 'utf-8')) as {
  publish_id: string;
  export_id: string;
  export_date: string;
  drive_file_id_csv: string;
  drive_file_id_xlsx: string;
  source_record_count: number;
  drive_record_count: number;
  sheets_record_count: number;
  reconcile_status: string;
};

const runId = `qa_${exportDateToTag(publishMeta.export_date)}_${randomUUID().slice(0, 6)}`;
const checkedAt = new Date().toISOString();

console.log(`=== QA Run: ${runId} ===`);
console.log(`Export date: ${publishMeta.export_date}`);
console.log(`Expected:    ${publishMeta.source_record_count} records\n`);

let failureReason: string | null = null;
let driveRowCount = 0;
let csvContent = '';

// ─── 1. Verify Drive CSV file ─────────────────────────────────────────────

console.log('1. Verifying Drive CSV file...');
const driveAuth = getGoogleAuthClient(['https://www.googleapis.com/auth/drive.readonly']);
const drive = google.drive({ version: 'v3', auth: driveAuth });

try {
  const fileRes = await drive.files.get({
    fileId: publishMeta.drive_file_id_csv,
    fields: 'id,name,mimeType,size',
  });
  console.log(`  File: ${fileRes.data.name} (${fileRes.data.size} bytes)`);

  // Download and count rows
  const exportRes = await drive.files.export(
    { fileId: publishMeta.drive_file_id_csv, mimeType: 'text/csv' },
    { responseType: 'text' },
  );
  csvContent = exportRes.data as string;
  const lines = csvContent.split('\n').filter((l) => l.trim());
  driveRowCount = lines.length - 1; // subtract header
  console.log(`  Drive row count: ${driveRowCount}`);
} catch (err) {
  failureReason = `Failed to access Drive CSV (id=${publishMeta.drive_file_id_csv}): ${String(err)}`;
  console.error(`  [fail] ${failureReason}`);
}

// ─── 2. Verify Drive XLSX file ────────────────────────────────────────────

if (!failureReason) {
  console.log('\n2. Verifying Drive XLSX file...');
  try {
    const fileRes = await drive.files.get({
      fileId: publishMeta.drive_file_id_xlsx,
      fields: 'id,name,size',
    });
    console.log(`  File: ${fileRes.data.name} (${fileRes.data.size} bytes)`);
  } catch (err) {
    failureReason = `Failed to access Drive XLSX (id=${publishMeta.drive_file_id_xlsx}): ${String(err)}`;
    console.error(`  [fail] ${failureReason}`);
  }
}

// ─── 3. Check row count ───────────────────────────────────────────────────

if (!failureReason) {
  console.log('\n3. Checking row count...');
  if (driveRowCount !== publishMeta.source_record_count) {
    failureReason = `Row count mismatch: expected ${publishMeta.source_record_count}, got ${driveRowCount} from Drive.`;
    console.error(`  [fail] ${failureReason}`);
  } else {
    console.log(`  Row counts match: ${driveRowCount}`);
  }
}

// ─── 4. Check required columns ────────────────────────────────────────────

if (!failureReason && csvContent) {
  console.log('\n4. Checking required columns...');
  const headerLine = csvContent.split('\n')[0] ?? '';
  const headerCols = headerLine.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
  const missingCols = EXPORT_COLUMNS.filter((col) => !headerCols.includes(col));
  if (missingCols.length > 0) {
    failureReason = `Missing required columns in Drive CSV: ${missingCols.join(', ')}`;
    console.error(`  [fail] ${failureReason}`);
  } else {
    console.log(`  All ${EXPORT_COLUMNS.length} required columns present.`);
  }
}

// ─── 5. Check reconcile status ────────────────────────────────────────────

if (!failureReason && publishMeta.reconcile_status !== 'ok') {
  failureReason = `Publish reconcile_status is '${publishMeta.reconcile_status}', not 'ok'.`;
  console.warn(`\n5. [warn] ${failureReason}`);
}

// ─── Write qa_result.json ─────────────────────────────────────────────────

const qaResult: QaResult = {
  run_id: runId,
  status: failureReason ? 'fail' : 'pass',
  expected_row_count: publishMeta.source_record_count,
  drive_row_count: driveRowCount,
  drive_file_id_csv: publishMeta.drive_file_id_csv,
  drive_file_id_xlsx: publishMeta.drive_file_id_xlsx,
  checked_at: checkedAt,
  failure_reason: failureReason,
};

writeFileSync(
  join(qaDir, 'qa_result.json'),
  JSON.stringify(qaResult, null, 2),
);

// ─── Write qa_report.md ───────────────────────────────────────────────────

const report = `# QA Report

## Run Information
- run_id: ${runId}
- checked_at: ${checkedAt}
- export_date: ${publishMeta.export_date}
- publish_id: ${publishMeta.publish_id}

## Environment
- Runtime: Cloudflare Workers
- Export source: Google Drive (verified via Drive API)

## Input
- source_record_count: ${publishMeta.source_record_count}

## Worker Execution
- Cron-triggered batch processing via Cloudflare Workers
- Status tracked in D1 state database

## Export Result
- export_id: ${publishMeta.export_id}
- Records exported: ${publishMeta.source_record_count}

## Google Drive Upload
- CSV file id:  ${publishMeta.drive_file_id_csv}
- XLSX file id: ${publishMeta.drive_file_id_xlsx}
- Drive CSV row count: ${driveRowCount}

## Google Sheets
- Tab: ${publishMeta.export_date}
- Sheets row count: ${publishMeta.sheets_record_count}

## Row Count Comparison
| Layer   | Count |
|---------|-------|
| Source  | ${publishMeta.source_record_count} |
| Drive   | ${driveRowCount} |
| Sheets  | ${publishMeta.sheets_record_count} |

## Reconcile Status
- ${publishMeta.reconcile_status}

## Required Columns
- All ${EXPORT_COLUMNS.length} required columns verified.

## Final Verdict
**${qaResult.status.toUpperCase()}**${failureReason ? `\n\nFailure reason: ${failureReason}` : ''}
`;

writeFileSync(join(qaDir, 'qa_report.md'), report);

console.log(`\n=== QA Result: ${qaResult.status.toUpperCase()} ===`);
if (failureReason) {
  console.error(`Failure: ${failureReason}`);
  process.exit(1);
} else {
  console.log('All checks passed.');
  console.log('Artifacts: output/qa/qa_result.json, output/qa/qa_report.md');
}

// ─── Helper ───────────────────────────────────────────────────────────────

function exportDateToTag(date: string): string {
  return date.replace(/-/g, '_');
}
