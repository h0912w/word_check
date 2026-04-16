#!/usr/bin/env tsx

/**
 * Export Results Script (Local Execution)
 *
 * This script aggregates shard results and exports them to CSV/XLSX format.
 * - Merges completed shard results from SQLite database
 * - Creates date-stamped export files
 * - Ensures CSV is always created first
 * - XLSX is created as a secondary format with retry capability
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import initSqlJs from 'sql.js';
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

interface ExportResultRecord {
  word: string;
  avg_monthly_searches: number | null;
  competition: string | null;
  competition_index: number | null;
  monthly_searches_raw: unknown;
  collected_at: string;
  api_status: string;
  retry_count: number;
  source_shard: string;
  source_offset: number;
  input_batch_id: string;
  export_date: string;
  export_batch_id: string;
  row_key: string;
}

interface ExportResultsOptions {
  date?: string;
  outputDir?: string;
  includeFailed?: boolean;
}

interface ExportResultsResult {
  success: boolean;
  exportDate: string;
  exportBatchId: string;
  recordCount: number;
  csvPath: string;
  xlsxPath: string;
  errors: string[];
}

function generateExportDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateExportBatchId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `export_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

function createRowKey(record: ExportResultRecord): string {
  return `${record.export_date}|${record.input_batch_id}|${record.source_shard}|${record.source_offset}|${record.word}`;
}

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCsvRecord(record: ExportResultRecord): string {
  const columns = [
    record.word,
    record.avg_monthly_searches,
    record.competition,
    record.competition_index,
    JSON.stringify(record.monthly_searches_raw),
    record.collected_at,
    record.api_status,
    record.retry_count,
    record.source_shard,
    record.source_offset,
    record.input_batch_id,
    record.export_date,
    record.export_batch_id,
  ];

  return columns.map(escapeCsvValue).join(",");
}

/**
 * Load results from SQLite database
 */
async function loadResultsFromSQLite(
  dbPath: string,
  inputBatchId: string,
  includeFailed: boolean = false
): Promise<ExportResultRecord[]> {
  try {
    console.log(`  Loading results from SQLite for batch: ${inputBatchId}`);

    // Initialize sql.js
    const SQL = await initSqlJs();

    if (!fs.existsSync(dbPath)) {
      console.warn(`  Database not found: ${dbPath}`);
      return [];
    }

    const dbData = fs.readFileSync(dbPath);
    const db = new SQL.Database(dbData);

    // Build query
    let query = `SELECT
      row_key, word, avg_monthly_searches, competition, competition_index,
      monthly_searches_raw, collected_at, api_status, retry_count,
      source_shard, source_offset, input_batch_id
      FROM keyword_results
      WHERE input_batch_id = '${inputBatchId}'`;

    if (!includeFailed) {
      query += " AND api_status = 'success'";
    }

    query += " ORDER BY source_shard, source_offset";

    const result = db.exec(query);

    if (result.length === 0) {
      console.warn(`  No results found in database`);
      return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    console.log(`  Found ${values.length} records in database`);

    // Map database rows to export records
    const records: ExportResultRecord[] = values.map((row) => {
      const record: ExportResultRecord = {
        word: row[columns.indexOf('word')] as string,
        avg_monthly_searches: row[columns.indexOf('avg_monthly_searches')] as number | null,
        competition: row[columns.indexOf('competition')] as string | null,
        competition_index: row[columns.indexOf('competition_index')] as number | null,
        monthly_searches_raw: row[columns.indexOf('monthly_searches_raw')]
          ? JSON.parse(row[columns.indexOf('monthly_searches_raw')] as string)
          : null,
        collected_at: row[columns.indexOf('collected_at')] as string,
        api_status: row[columns.indexOf('api_status')] as string,
        retry_count: row[columns.indexOf('retry_count')] as number,
        source_shard: row[columns.indexOf('source_shard')] as string,
        source_offset: row[columns.indexOf('source_offset')] as number,
        input_batch_id: row[columns.indexOf('input_batch_id')] as string,
        export_date: "", // Will be set by caller
        export_batch_id: "", // Will be set by caller
        row_key: row[columns.indexOf('row_key')] as string,
      };
      return record;
    });

    return records;
  } catch (error) {
    console.error(`  Failed to load results from SQLite:`, error);
    return [];
  }
}

async function exportResults(
  options: ExportResultsOptions
): Promise<ExportResultsResult> {
  const result: ExportResultsResult = {
    success: false,
    exportDate: options.date || generateExportDate(),
    exportBatchId: generateExportBatchId(),
    recordCount: 0,
    csvPath: "",
    xlsxPath: "",
    errors: [],
  };

  try {
    // Determine output directory
    const outputDir = options.outputDir || path.join(PROJECT_ROOT, "output/exports");

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("Exporting results...");
    console.log(`  Export Date: ${result.exportDate}`);
    console.log(`  Export Batch ID: ${result.exportBatchId}`);

    // Load shard manifest
    const manifestPath = path.join(PROJECT_ROOT, "output/manifests/shard_manifest.json");
    if (!fs.existsSync(manifestPath)) {
      result.errors.push("No shard manifest found. Run 'npm run build-shards' first.");
      return result;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const inputBatchId = manifest.input_batch_id;

    // Database path
    const dbPath = path.join(PROJECT_ROOT, "data/word-check.db");

    // Load actual results from SQLite
    let records = await loadResultsFromSQLite(dbPath, inputBatchId, options.includeFailed);

    if (records.length === 0) {
      console.log(`  No records in database. Shards may not have been processed yet.`);
      console.log(`  Run collect-metrics to process shards first.`);
    }

    // Set export metadata on records
    records = records.map(record => ({
      ...record,
      export_date: result.exportDate,
      export_batch_id: result.exportBatchId,
    }));

    // Recalculate row_keys with export metadata
    for (const record of records) {
      record.row_key = createRowKey(record);
    }

    console.log(`  Loaded ${records.length} records`);

    if (records.length === 0) {
      console.log("  ⚠ No records to export. Shards may not be processed yet.");
      console.log("  Run collect-metrics to process shards first.");
    }

    // Create CSV export
    const csvFileName = `keyword_metrics_${result.exportDate}.csv`;
    const csvPath = path.join(outputDir, csvFileName);
    result.csvPath = csvPath;

    console.log(`  Creating CSV: ${csvFileName}`);

    // CSV header
    const csvHeader = [
      "word",
      "avg_monthly_searches",
      "competition",
      "competition_index",
      "monthly_searches_raw",
      "collected_at",
      "api_status",
      "retry_count",
      "source_shard",
      "source_offset",
      "input_batch_id",
      "export_date",
      "export_batch_id",
    ].join(",");

    // CSV content
    const csvContent = [
      csvHeader,
      ...records.map(formatCsvRecord),
    ].join("\n") + "\n";

    fs.writeFileSync(csvPath, csvContent, "utf-8");
    console.log(`  ✓ CSV created: ${csvPath}`);

    // Create XLSX export (optional, can fail independently)
    const xlsxFileName = `keyword_metrics_${result.exportDate}.xlsx`;
    const xlsxPath = path.join(outputDir, xlsxFileName);
    result.xlsxPath = xlsxPath;

    console.log(`  Creating XLSX: ${xlsxFileName}`);

    try {
      // Prepare data for XLSX
      const xlsxData = records.map((record) => ({
        word: record.word,
        avg_monthly_searches: record.avg_monthly_searches ?? "",
        competition: record.competition ?? "",
        competition_index: record.competition_index ?? "",
        monthly_searches_raw: JSON.stringify(record.monthly_searches_raw),
        collected_at: record.collected_at,
        api_status: record.api_status,
        retry_count: record.retry_count,
        source_shard: record.source_shard,
        source_offset: record.source_offset,
        input_batch_id: record.input_batch_id,
        export_date: record.export_date,
        export_batch_id: record.export_batch_id,
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(xlsxData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 30 }, // word
        { wch: 15 }, // avg_monthly_searches
        { wch: 12 }, // competition
        { wch: 12 }, // competition_index
        { wch: 20 }, // monthly_searches_raw
        { wch: 25 }, // collected_at
        { wch: 10 }, // api_status
        { wch: 10 }, // retry_count
        { wch: 15 }, // source_shard
        { wch: 10 }, // source_offset
        { wch: 20 }, // input_batch_id
        { wch: 12 }, // export_date
        { wch: 20 }, // export_batch_id
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Keyword Metrics");

      // Write file
      XLSX.writeFile(workbook, xlsxPath);
      console.log(`  ✓ XLSX created: ${xlsxPath}`);
    } catch (error) {
      console.error(`  ✗ XLSX creation failed (CSV is preserved):`, error);
      result.errors.push(`XLSX creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.recordCount = records.length;
    result.success = true;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : String(error)
    );
  }

  return result;
}

function printUsage(): void {
  console.log(`
Usage: npm run export [options]

Options:
  --date <YYYY-MM-DD>  Export date (default: today)
  --output <path>      Output directory (default: output/exports/)
  --include-failed     Include failed records in export

Examples:
  npm run export
  npm run export -- --date 2026-04-12
  npm run export -- --output ./custom/exports
`);
}

async function main(): Promise<void> {
  console.log("Word Check - Export Results (Local Execution)");
  console.log("=".repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: ExportResultsOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      case "--date":
        options.date = args[++i];
        break;
      case "--output":
        options.outputDir = args[++i];
        break;
      case "--include-failed":
        options.includeFailed = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  // Validate date format if provided
  if (options.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(options.date)) {
      console.error("Invalid date format. Use YYYY-MM-DD format.");
      process.exit(1);
    }
  }

  // Run export
  const result = await exportResults(options);

  console.log("\n" + "=".repeat(60));
  console.log("EXPORT SUMMARY");
  console.log("=".repeat(60));

  if (result.success || result.csvPath) {
    console.log(`\n✓ Export completed!`);
    console.log(`  Export Date: ${result.exportDate}`);
    console.log(`  Export Batch ID: ${result.exportBatchId}`);
    console.log(`  Records: ${result.recordCount}`);
    console.log(`  CSV: ${result.csvPath}`);
    console.log(`  XLSX: ${result.xlsxPath}`);
    console.log(`\nNext steps:`);
    console.log(`  npm run publish            # Publish to Drive and Sheets`);
  } else {
    console.log(`\n✗ Export failed!`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
