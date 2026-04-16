#!/usr/bin/env tsx

/**
 * Backfill Sheets Script
 *
 * This script reconciles discrepancies between Drive source records
 * and Sheets reflected records by:
 * - Detecting missing row_keys
 * - Re-appending missing records
 * - Generating backfill reports
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Load environment variables
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

interface BackfillSheetsOptions {
  date?: string;
  csvPath?: string;
  sheetTabName?: string;
}

interface BackfillResult {
  success: boolean;
  exportDate: string;
  sheetTabName: string;
  sourceRecordCount: number;
  sheetsRecordCount: number;
  missingRowKeys: string[];
  duplicatedRowKeys: string[];
  backfilledCount: number;
  errors: string[];
}

interface BackfillReport {
  export_date: string;
  sheet_tab_name: string;
  source_record_count: number;
  sheets_record_count: number;
  missing_row_keys: string[];
  duplicated_row_keys: string[];
  backfilled_count: number;
  verified_at: string;
}

function parseCsvRecords(csvPath: string): Map<string, any> {
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return new Map();
  }

  // Parse header
  const header = lines[0].split(",");

  // Parse records
  const records = new Map<string, any>();
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length > 0) {
      const word = values[0].replace(/^"|"$/g, "");
      const sourceShard = values[8] || "";
      const sourceOffset = values[9] || "0";
      const exportDate = values[11] || "";
      const inputBatchId = values[10] || "";

      const rowKey = `${exportDate}|${inputBatchId}|${sourceShard}|${sourceOffset}|${word}`;
      records.set(rowKey, { word, values });
    }
  }

  return records;
}

async function fetchSheetsRowKeys(
  sheetTabName: string
): Promise<Set<string>> {
  console.log(`Fetching row keys from sheet tab: ${sheetTabName}`);

  const rowKeys = new Set<string>();

  try {
    // Check required environment variables
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!clientId || !clientSecret || !refreshToken || !spreadsheetId) {
      console.warn("  Missing Google credentials, skipping row key fetch");
      return rowKeys;
    }

    // Create OAuth2 client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    // Create Sheets client
    const sheets = google.sheets({ version: "v4", auth });

    // Fetch all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetTabName}!A:L`, // Get columns A through L
    });

    const values = response.data.values;

    if (!values || values.length === 0) {
      console.log(`  No data found in sheet tab: ${sheetTabName}`);
      return rowKeys;
    }

    // Skip header row (first row)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row.length < 12) continue; // Need at least 12 columns for row_key

      const word = row[0];
      const inputBatchId = row[10];
      const sourceShard = row[8];
      const sourceOffset = row[9];
      const exportDate = row[11];

      if (word && inputBatchId && sourceShard && sourceOffset !== undefined && exportDate) {
        const rowKey = `${exportDate}|${inputBatchId}|${sourceShard}|${sourceOffset}|${word}`;
        rowKeys.add(rowKey);
      }
    }

    console.log(`  Found ${rowKeys.size} row keys in sheet`);
  } catch (error) {
    console.error(`  Failed to fetch row keys from sheets:`, error);
  }

  return rowKeys;
}

async function appendMissingRecords(
  missingRecords: any[],
  sheetTabName: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const errors: string[] = [];

  try {
    console.log(`Appending ${missingRecords.length} missing records...`);

    // Check required environment variables
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!clientId || !clientSecret || !refreshToken || !spreadsheetId) {
      errors.push("Missing Google credentials");
      return { success: false, count: 0, errors };
    }

    // Create OAuth2 client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    // Create Sheets client
    const sheets = google.sheets({ version: "v4", auth });

    // Prepare data for append
    const values = missingRecords.map((record) => {
      // record.values is the CSV-parsed array
      return record.values || [];
    });

    if (values.length === 0) {
      console.log("  No records to append");
      return { success: true, count: 0, errors: [] };
    }

    // Append data to sheet
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${sheetTabName}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: values,
      },
    });

    const updatedRows = appendResponse.data.updates?.updatedRows || 0;
    console.log(`  ✓ Appended ${updatedRows} rows to sheet`);

    return {
      success: true,
      count: updatedRows,
      errors: [],
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to append records: ${errorMsg}`);
    console.error(`  ✗ Failed to append records:`, error);
    return { success: false, count: 0, errors };
  }
}

async function backfillSheets(
  options: BackfillSheetsOptions
): Promise<BackfillResult> {
  const result: BackfillResult = {
    success: false,
    exportDate: options.date || new Date().toISOString().split("T")[0],
    sheetTabName: options.sheetTabName || "",
    sourceRecordCount: 0,
    sheetsRecordCount: 0,
    missingRowKeys: [],
    duplicatedRowKeys: [],
    backfilledCount: 0,
    errors: [],
  };

  try {
    // Determine CSV path
    let csvPath: string;
    if (options.csvPath) {
      csvPath = options.csvPath;
    } else {
      const outputDir = path.join(PROJECT_ROOT, "output/exports");
      csvPath = path.join(outputDir, `keyword_metrics_${result.exportDate}.csv`);
    }

    if (!fs.existsSync(csvPath)) {
      result.errors.push(`CSV file not found: ${csvPath}`);
      return result;
    }

    console.log(`Backfilling Sheets for: ${csvPath}`);

    // Parse source records
    const sourceRecords = parseCsvRecords(csvPath);
    result.sourceRecordCount = sourceRecords.size;
    console.log(`  Source records: ${result.sourceRecordCount}`);

    if (result.sourceRecordCount === 0) {
      result.errors.push("No source records found");
      return result;
    }

    // Determine sheet tab name
    const sheetTabName = options.sheetTabName || result.exportDate;
    result.sheetTabName = sheetTabName;

    // Fetch existing row keys from Sheets
    const sheetsRowKeys = await fetchSheetsRowKeys(sheetTabName);
    result.sheetsRecordCount = sheetsRowKeys.size;
    console.log(`  Sheets records: ${result.sheetsRecordCount}`);

    // Find missing row keys
    for (const [rowKey] of sourceRecords) {
      if (!sheetsRowKeys.has(rowKey)) {
        result.missingRowKeys.push(rowKey);
      }
    }

    console.log(`  Missing row keys: ${result.missingRowKeys.length}`);

    if (result.missingRowKeys.length > 0) {
      console.log(`  First few missing: ${result.missingRowKeys.slice(0, 3).join(", ")}`);
    }

    // Check for duplicates in Sheets
    // TODO: Implement duplicate detection

    // Backfill missing records
    if (result.missingRowKeys.length > 0) {
      const missingRecords: any[] = [];
      for (const rowKey of result.missingRowKeys) {
        const record = sourceRecords.get(rowKey);
        if (record) {
          missingRecords.push(record);
        }
      }

      const appendResult = await appendMissingRecords(missingRecords, sheetTabName);
      result.backfilledCount = appendResult.success ? appendResult.count : 0;
      result.errors.push(...appendResult.errors);
    }

    // Create backfill report
    const report: BackfillReport = {
      export_date: result.exportDate,
      sheet_tab_name: result.sheetTabName,
      source_record_count: result.sourceRecordCount,
      sheets_record_count: result.sheetsRecordCount,
      missing_row_keys: result.missingRowKeys,
      duplicated_row_keys: result.duplicatedRowKeys,
      backfilled_count: result.backfilledCount,
      verified_at: new Date().toISOString(),
    };

    const reportsDir = path.join(PROJECT_ROOT, "output/exports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `sheets_backfill_report_${result.exportDate}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nBackfill report saved: ${reportPath}`);

    result.success = result.errors.length === 0;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : String(error)
    );
  }

  return result;
}

function printUsage(): void {
  console.log(`
Usage: npm run backfill-sheets [options]

Options:
  --date <YYYY-MM-DD>  Export date to backfill (default: today)
  --csv <path>         Path to CSV file (default: auto-detected)
  --tab <name>         Sheets tab name (default: export date)

Examples:
  npm run backfill-sheets
  npm run backfill-sheets -- --date 2026-04-12
  npm run backfill-sheets -- --tab "2026-04"
`);
}

async function main(): Promise<void> {
  console.log("Word Check - Backfill Sheets");
  console.log("=".repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: BackfillSheetsOptions = {};

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
      case "--csv":
        options.csvPath = args[++i];
        break;
      case "--tab":
        options.sheetTabName = args[++i];
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  // Run backfill
  const result = await backfillSheets(options);

  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL SUMMARY");
  console.log("=".repeat(60));

  if (result.success) {
    console.log(`\n✓ Backfill completed!`);
    console.log(`  Export Date: ${result.exportDate}`);
    console.log(`  Sheet Tab: ${result.sheetTabName}`);
    console.log(`  Source Records: ${result.sourceRecordCount}`);
    console.log(`  Sheets Records: ${result.sheetsRecordCount}`);
    console.log(`  Missing Records: ${result.missingRowKeys.length}`);
    console.log(`  Backfilled: ${result.backfilledCount}`);

    if (result.duplicatedRowKeys.length > 0) {
      console.log(`  ⚠️  Duplicates: ${result.duplicatedRowKeys.length}`);
    }

    if (result.missingRowKeys.length > 0 && result.backfilledCount === 0) {
      console.log(`\n⚠️  Some records were not backfilled`);
    }
  } else {
    console.log(`\n✗ Backfill failed!`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
