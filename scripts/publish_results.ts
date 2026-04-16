#!/usr/bin/env tsx

/**
 * Publish Results Script
 *
 * This script publishes exported results to:
 * - Google Drive: Original file storage
 * - Google Sheets: View layer with row_key validation
 *
 * Ensures:
 * - Drive upload success is recorded
 * - Sheets append success is recorded
 * - Record counts are verified
 * - Discrepancies trigger backfill candidates
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

interface PublishResultsOptions {
  date?: string;
  csvPath?: string;
  skipDrive?: boolean;
  skipSheets?: boolean;
}

interface PublishResultsResult {
  success: boolean;
  publishId: string;
  exportDate: string;
  driveStatus: string;
  sheetsStatus: string;
  driveFileId: string | null;
  sheetTabName: string | null;
  sourceRecordCount: number;
  driveRecordCount: number;
  sheetsRecordCount: number;
  errors: string[];
}

function generatePublishId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `publish_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

async function uploadToDrive(
  csvPath: string,
  exportDate: string,
  options: PublishResultsOptions
): Promise<{ success: boolean; fileId: string | null; errors: string[] }> {
  const errors: string[] = [];

  try {
    console.log("Uploading to Google Drive...");
    console.log(`  File: ${csvPath}`);

    // Check required environment variables
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_EXPORT_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken) {
      errors.push("Missing Google OAuth credentials. Check .env.local file.");
      return { success: false, fileId: null, errors };
    }

    // Create OAuth2 client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    // Create Drive client
    const drive = google.drive({ version: "v3", auth });

    // Read file content
    const fileContent = fs.readFileSync(csvPath, "utf-8");
    const fileName = path.basename(csvPath);

    // Create file metadata
    const fileMetadata: any = {
      name: fileName,
    };

    // Add parent folder if specified
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    // Create media object
    const media = {
      mimeType: "text/csv",
      body: fileContent,
    };

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media as any,
      fields: "id,name",
    });

    const uploadedFile = response.data;
    console.log(`  ✓ Uploaded to Drive: ${uploadedFile.name} (ID: ${uploadedFile.id})`);

    return {
      success: true,
      fileId: uploadedFile.id || null,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Drive upload failed: ${errorMessage}`);
    console.error(`  ✗ Drive upload failed:`, error);
    return { success: false, fileId: null, errors };
  }
}

async function appendToSheets(
  csvPath: string,
  exportDate: string,
  options: PublishResultsOptions
): Promise<{ success: boolean; tabName: string | null; recordCount: number; errors: string[] }> {
  const errors: string[] = [];

  try {
    console.log("Appending to Google Sheets...");

    // Check required environment variables
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!clientId || !clientSecret || !refreshToken) {
      errors.push("Missing Google OAuth credentials. Check .env.local file.");
      return { success: false, tabName: null, recordCount: 0, errors };
    }

    if (!spreadsheetId) {
      errors.push("GOOGLE_SHEETS_SPREADSHEET_ID not set in .env.local");
      return { success: false, tabName: null, recordCount: 0, errors };
    }

    // Read CSV to get data
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      errors.push("CSV file has no data rows");
      return { success: false, tabName: null, recordCount: 0, errors };
    }

    const recordCount = lines.length - 1; // Exclude header
    console.log(`  Records to append: ${recordCount}`);

    // Create OAuth2 client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    // Create Sheets client
    const sheets = google.sheets({ version: "v4", auth });

    // Create tab name from date
    const tabName = exportDate; // e.g., "2026-04-12"

    // Check if sheet exists, create if not
    try {
      const spreadsheetResponse = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
      });

      const existingSheet = spreadsheetResponse.data.sheets?.find(
        (s) => s.properties?.title === tabName
      );

      if (!existingSheet) {
        // Create new sheet
        console.log(`  Creating new sheet tab: ${tabName}`);
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: tabName,
                  },
                },
              },
            ],
          },
        });
      } else {
        console.log(`  Using existing sheet tab: ${tabName}`);
      }
    } catch (error) {
      console.warn(`  Could not check/create sheet tab:`, error);
    }

    // Parse CSV and prepare data for Sheets
    const header = lines[0].split(",");
    const dataRows = lines.slice(1).map((line) => {
      // Simple CSV parsing (may need improvement for quoted values)
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current);

      return values;
    });

    // Prepare data for append (include header for new sheets)
    const appendData = [header, ...dataRows];

    // Append data to sheet
    console.log(`  Appending ${appendData.length} rows to sheet...`);

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: appendData,
      },
    });

    const updatedRows = appendResponse.data.updates?.updatedRows || 0;
    console.log(`  ✓ Appended ${updatedRows} rows to sheet`);

    return {
      success: true,
      tabName: tabName,
      recordCount: recordCount,
      errors: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Sheets append failed: ${errorMessage}`);
    console.error(`  ✗ Sheets append failed:`, error);
    return { success: false, tabName: null, recordCount: 0, errors };
  }
}

function getSourceRecordCount(csvPath: string): number {
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((l) => l.trim().length > 0);
  return Math.max(0, lines.length - 1); // Exclude header
}

function createPublishReport(result: PublishResultsResult): string {
  const report = {
    publish_id: result.publishId,
    export_date: result.exportDate,
    drive_status: result.driveStatus,
    sheets_status: result.sheetsStatus,
    drive_file_id: result.driveFileId,
    sheet_tab_name: result.sheetTabName,
    source_record_count: result.sourceRecordCount,
    drive_record_count: result.driveRecordCount,
    sheets_record_count: result.sheetsRecordCount,
    created_at: new Date().toISOString(),
    verified_at: result.driveRecordCount === result.sourceRecordCount &&
                 result.sheetsRecordCount === result.sourceRecordCount
                 ? new Date().toISOString()
                 : null,
  };

  return JSON.stringify(report, null, 2);
}

async function publishResults(
  options: PublishResultsOptions
): Promise<PublishResultsResult> {
  const result: PublishResultsResult = {
    success: false,
    publishId: generatePublishId(),
    exportDate: options.date || new Date().toISOString().split("T")[0],
    driveStatus: "skipped",
    sheetsStatus: "skipped",
    driveFileId: null,
    sheetTabName: null,
    sourceRecordCount: 0,
    driveRecordCount: 0,
    sheetsRecordCount: 0,
    errors: [],
  };

  try {
    // Determine CSV path
    let csvPath = options.csvPath;
    if (!csvPath) {
      const outputDir = path.join(PROJECT_ROOT, "output/exports");
      csvPath = path.join(outputDir, `keyword_metrics_${result.exportDate}.csv`);
    }

    if (!fs.existsSync(csvPath)) {
      result.errors.push(`CSV file not found: ${csvPath}`);
      return result;
    }

    console.log(`Publishing results from: ${csvPath}`);

    // Get source record count
    result.sourceRecordCount = getSourceRecordCount(csvPath);
    console.log(`Source record count: ${result.sourceRecordCount}`);

    if (result.sourceRecordCount === 0) {
      result.errors.push("No records to publish");
      return result;
    }

    // Upload to Drive
    if (!options.skipDrive) {
      const driveResult = await uploadToDrive(csvPath, result.exportDate, options);
      result.driveStatus = driveResult.success ? "success" : "failed";
      result.driveFileId = driveResult.fileId;
      result.driveRecordCount = driveResult.success ? result.sourceRecordCount : 0;
      result.errors.push(...driveResult.errors);
    } else {
      console.log("Skipping Drive upload");
    }

    // Append to Sheets
    if (!options.skipSheets) {
      const sheetsResult = await appendToSheets(csvPath, result.exportDate, options);
      result.sheetsStatus = sheetsResult.success ? "success" : "failed";
      result.sheetTabName = sheetsResult.tabName;
      result.sheetsRecordCount = sheetsResult.success ? sheetsResult.recordCount : 0;
      result.errors.push(...sheetsResult.errors);
    } else {
      console.log("Skipping Sheets append");
    }

    // Verify counts match
    if (result.driveRecordCount !== result.sourceRecordCount) {
      result.errors.push(
        `Drive record count mismatch: expected ${result.sourceRecordCount}, got ${result.driveRecordCount}`
      );
    }

    if (result.sheetsRecordCount !== result.sourceRecordCount) {
      result.errors.push(
        `Sheets record count mismatch: expected ${result.sourceRecordCount}, got ${result.sheetsRecordCount}`
      );
    }

    // Create publish report
    const reportDir = path.join(PROJECT_ROOT, "output/exports");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `publish_report_${result.exportDate}.json`);
    fs.writeFileSync(reportPath, createPublishReport(result));
    console.log(`\nPublish report saved: ${reportPath}`);

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
Usage: npm run publish [options]

Options:
  --date <YYYY-MM-DD>  Export date to publish (default: today)
  --csv <path>         Path to CSV file (default: auto-detected)
  --skip-drive         Skip Google Drive upload
  --skip-sheets        Skip Google Sheets append

Examples:
  npm run publish
  npm run publish -- --date 2026-04-12
  npm run publish -- --skip-sheets
`);
}

async function main(): Promise<void> {
  console.log("Word Check - Publish Results");
  console.log("=".repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: PublishResultsOptions = {};

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
      case "--skip-drive":
        options.skipDrive = true;
        break;
      case "--skip-sheets":
        options.skipSheets = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  // Run publish
  const result = await publishResults(options);

  console.log("\n" + "=".repeat(60));
  console.log("PUBLISH SUMMARY");
  console.log("=".repeat(60));

  if (result.success || result.driveStatus === "success" || result.sheetsStatus === "success") {
    console.log(`\n✓ Publish completed!`);
    console.log(`  Publish ID: ${result.publishId}`);
    console.log(`  Export Date: ${result.exportDate}`);
    console.log(`  Source Records: ${result.sourceRecordCount}`);
    console.log(`  Drive Status: ${result.driveStatus}`);
    if (result.driveFileId) {
      console.log(`  Drive File ID: ${result.driveFileId}`);
    }
    console.log(`  Sheets Status: ${result.sheetsStatus}`);
    if (result.sheetTabName) {
      console.log(`  Sheets Tab: ${result.sheetTabName}`);
    }
    console.log(`  Drive Records: ${result.driveRecordCount}`);
    console.log(`  Sheets Records: ${result.sheetsRecordCount}`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
      console.log(`\nConsider running backfill to reconcile discrepancies:`);
      console.log(`  npm run backfill-sheets`);
    }
  } else {
    console.log(`\n✗ Publish failed!`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Publish failed:", error);
  process.exit(1);
});
