#!/usr/bin/env tsx

/**
 * Bootstrap Storage Script (Local Execution)
 *
 * This script initializes the storage layer:
 * - Creates SQLite database
 * - Registers shards in database
 * - Uploads shards to Google Drive (optional, with --drive flag)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

interface BootstrapStorageOptions {
  skipDb?: boolean;
  drive?: boolean;
  dryRun?: boolean;
}

interface BootstrapStorageResult {
  success: boolean;
  dbInitialized: boolean;
  shardsRegistered: number;
  driveUploaded: boolean;
  errors: string[];
}

async function initializeDatabase(dryRun: boolean): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const schemaPath = path.join(PROJECT_ROOT, 'config/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      errors.push(`Schema file not found: ${schemaPath}`);
      return { success: false, errors };
    }

    console.log('Initializing SQLite database...');

    // Ensure data directory exists
    const dataDir = path.join(PROJECT_ROOT, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'word-check.db');

    if (dryRun) {
      console.log('  [DRY RUN] Would create database at:', dbPath);
      return { success: true, errors: [] };
    }

    // Check if database already exists
    if (fs.existsSync(dbPath)) {
      console.log('  Database already exists, skipping initialization');
      return { success: true, errors: [] };
    }

    // Initialize sql.js and create database
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.run(schema);

    // Save database to file
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    db.close();

    console.log('  ✓ SQLite database initialized');
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { success: errors.length === 0, errors };
}

async function loadManifest(): Promise<any | null> {
  const manifestPath = path.join(PROJECT_ROOT, 'output/manifests/shard_manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.log('  ⚠ No shard manifest found. Run \'npm run build-shards\' first.');
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`  ✗ Failed to load manifest: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function registerShardsInDatabase(
  manifest: any,
  dryRun: boolean
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    console.log('Registering shards in database...');

    const dbPath = path.join(PROJECT_ROOT, 'data/word-check.db');
    if (!fs.existsSync(dbPath)) {
      errors.push('Database not found. Run npm run init-db first.');
      return { success: false, count: 0, errors };
    }

    // Load database from file
    const SQL = await initSqlJs();
    const dbData = fs.readFileSync(dbPath);
    const db = new SQL.Database(dbData);

    const inputBatchId = manifest.input_batch_id;
    const shards = manifest.shards || [];

    if (shards.length === 0) {
      errors.push('No shards found in manifest');
      db.close();
      return { success: false, count: 0, errors };
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would register ${shards.length} shards`);
      db.close();
      return { success: true, count: shards.length, errors: [] };
    }

    // Insert input batch
    try {
      db.run(
        `INSERT OR REPLACE INTO input_batches (input_batch_id, uploaded_at, source_filename, total_rows, status, normalized_path)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          inputBatchId,
          manifest.created_at,
          'normalized_words.txt',
          manifest.total_rows,
          'prepared',
          'output/prepared/normalized_words.txt'
        ]
      );
      console.log(`  ✓ Registered input batch: ${inputBatchId}`);
    } catch (error) {
      errors.push(`Failed to insert input batch: ${error instanceof Error ? error.message : String(error)}`);
      db.close();
      return { success: false, count: 0, errors };
    }

    // Insert shards
    for (const shard of shards) {
      try {
        db.run(
          `INSERT OR REPLACE INTO shards (shard_id, input_batch_id, file_path, total_rows, status, current_offset, retry_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            shard.shard_id,
            inputBatchId,
            shard.file_path,
            shard.row_count,
            'pending',
            0,
            0
          ]
        );
        count++;
      } catch (error) {
        errors.push(`Failed to insert shard ${shard.shard_id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Save database to file
    const updatedData = db.export();
    fs.writeFileSync(dbPath, updatedData);
    db.close();

    console.log(`  ✓ Registered ${count} shards in database`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { success: errors.length === 0, count, errors };
}

async function uploadToDrive(
  manifest: any,
  dryRun: boolean
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    console.log('Uploading shards to Google Drive...');

    // Check required environment variables
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_INPUT_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken) {
      errors.push('Missing Google OAuth credentials. Check .env.local file.');
      console.log('  ⚠ Please manually upload shards to your Google Drive input folder');
      console.log(`  Folder ID: ${folderId || 'not set'}`);
      return { success: false, errors };
    }

    if (!folderId) {
      errors.push('GOOGLE_DRIVE_INPUT_FOLDER_ID not set in .env.local');
      console.log('  ⚠ Please set GOOGLE_DRIVE_INPUT_FOLDER_ID in .env.local');
      return { success: false, errors };
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would upload shards to Drive folder: ${folderId}`);
      console.log(`    Shards: ${manifest.shards.length} files`);
      return { success: true, errors: [] };
    }

    // Create OAuth2 client
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({
      refresh_token: refreshToken,
    });

    // Create Drive client
    const drive = google.drive({ version: 'v3', auth });

    // Upload each shard
    let uploadedCount = 0;
    for (const shard of manifest.shards) {
      try {
        let shardPath = shard.file_path;
        if (path.isAbsolute(shardPath)) {
          // Already absolute
        } else {
          shardPath = path.join(PROJECT_ROOT, shard.file_path);
        }

        if (!fs.existsSync(shardPath)) {
          console.warn(`  ⚠ Shard file not found: ${shardPath}`);
          continue;
        }

        const shardContent = fs.readFileSync(shardPath, 'utf-8');
        const fileName = `${shard.shard_id}.txt`;

        const fileMetadata = {
          name: fileName,
          parents: [folderId],
        };

        const media = {
          mimeType: 'text/plain',
          body: shardContent,
        };

        const response = await drive.files.create({
          requestBody: fileMetadata,
          media: media as any,
          fields: 'id,name',
        });

        uploadedCount++;
        console.log(`  ✓ Uploaded: ${fileName} (ID: ${response.data.id})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to upload ${shard.shard_id}: ${errorMsg}`);
        console.error(`  ✗ Failed to upload ${shard.shard_id}:`, error);
      }
    }

    // Upload manifest as well
    try {
      const manifestContent = JSON.stringify(manifest, null, 2);
      const manifestFileName = `shard_manifest_${manifest.input_batch_id}.json`;

      const fileMetadata = {
        name: manifestFileName,
        parents: [folderId],
      };

      const media = {
        mimeType: 'application/json',
        body: manifestContent,
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media as any,
        fields: 'id,name',
      });

      console.log(`  ✓ Uploaded manifest: ${manifestFileName} (ID: ${response.data.id})`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to upload manifest: ${errorMsg}`);
      console.error(`  ✗ Failed to upload manifest:`, error);
    }

    console.log(`  ✓ Uploaded ${uploadedCount}/${manifest.shards.length} shards to Drive`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { success: errors.length === 0, errors };
}

async function bootstrapStorage(
  options: BootstrapStorageOptions
): Promise<BootstrapStorageResult> {
  const result: BootstrapStorageResult = {
    success: false,
    dbInitialized: false,
    shardsRegistered: 0,
    driveUploaded: false,
    errors: [],
  };

  try {
    // Initialize database
    if (!options.skipDb) {
      const dbResult = await initializeDatabase(options.dryRun || false);
      result.dbInitialized = dbResult.success;
      result.errors.push(...dbResult.errors);
    } else {
      console.log('Skipping database initialization');
    }

    // Load manifest
    const manifest = await loadManifest();
    if (!manifest) {
      result.errors.push('No shard manifest found');
      return result;
    }

    // Register shards in database
    if (!options.skipDb) {
      const shardsResult = await registerShardsInDatabase(manifest, options.dryRun || false);
      result.shardsRegistered = shardsResult.count;
      result.errors.push(...shardsResult.errors);
    }

    // Upload to Drive (if requested)
    if (options.drive) {
      const driveResult = await uploadToDrive(manifest, options.dryRun || false);
      result.driveUploaded = driveResult.success;
      result.errors.push(...driveResult.errors);
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

function printUsage(): void {
  console.log(`
Usage: npm run bootstrap-storage [options]

Options:
  --skip-db            Skip database initialization
  --drive              Upload shards to Google Drive
  --dry-run            Show commands without executing them

Examples:
  npm run bootstrap-storage
  npm run bootstrap-storage -- --drive
  npm run bootstrap-storage -- --dry-run
`);
}

async function main(): Promise<void> {
  console.log('Word Check - Bootstrap Storage (Local Execution)');
  console.log('='.repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: BootstrapStorageOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      case '--skip-db':
        options.skipDb = true;
        break;
      case '--drive':
        options.drive = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  // Run bootstrap storage
  const result = await bootstrapStorage(options);

  console.log('');
  console.log('='.repeat(60));
  console.log('BOOTSTRAP STORAGE SUMMARY');
  console.log('='.repeat(60));

  if (result.success) {
    console.log('\n✓ Success!');
    if (result.dbInitialized) {
      console.log('  ✓ SQLite database initialized');
    }
    if (result.shardsRegistered > 0) {
      console.log(`  ✓ ${result.shardsRegistered} shards registered in database`);
    }
    if (result.driveUploaded) {
      console.log('  ✓ Shards uploaded to Google Drive');
    }
    console.log('\nNext steps:');
    console.log('  npm run collect-metrics  # Collect Google Ads metrics');
    console.log('  npm run export            # Export to CSV/XLSX');
    console.log('  npm run publish           # Publish to Drive/Sheets');
  } else {
    console.log('\n✗ Failed!');
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Bootstrap storage failed:', error);
  process.exit(1);
});
