#!/usr/bin/env tsx

/**
 * Initialize Database Script
 *
 * Creates and initializes the SQLite database for local execution.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Initialize SQLite database
 */
async function initializeDatabase(): Promise<void> {
  console.log('Word Check - Initialize Database');
  console.log('='.repeat(60));
  console.log('');

  // Initialize sql.js
  console.log('Initializing sql.js...');
  const SQL = await initSqlJs();

  // Ensure data directory exists
  const dataDir = path.join(PROJECT_ROOT, 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`  Created: ${dataDir}`);
  }

  // Database path
  const dbPath = path.join(dataDir, 'word-check.db');

  // Check if database already exists
  if (fs.existsSync(dbPath)) {
    console.log(`Database already exists: ${dbPath}`);
    const response = process.stdout.isTTY ? require('readline-sync').question('Reinitialize? (y/N): ') : 'n';
    if (response.toLowerCase() !== 'y') {
      console.log('Skipping initialization');
      return;
    }
    console.log('Removing existing database...');
    fs.unlinkSync(dbPath);
  }

  console.log('');
  console.log('Creating database...');

  // Create database connection
  const db = new SQL.Database();

  // Read schema file
  const schemaPath = path.join(PROJECT_ROOT, 'config/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`);
    db.close();
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Execute schema
  console.log('Applying schema...');
  db.run(schema);

  // Save database to file
  const data = db.export();
  fs.writeFileSync(dbPath, data);

  console.log('');
  console.log('='.repeat(60));
  console.log('Database initialized successfully!');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Database: ${dbPath}`);
  console.log('');

  // Verify tables
  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Tables created:');
  if (tablesResult.length > 0) {
    for (const tableName of tablesResult[0].values) {
      console.log(`  - ${tableName[0]}`);
    }
  }

  db.close();
  console.log('');
  console.log('Next steps:');
  console.log('  1. Prepare input: npm run prepare-input');
  console.log('  2. Build shards: npm run build-shards');
  console.log('  3. Collect metrics: npm run collect-metrics');
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

main();
