#!/usr/bin/env tsx

/**
 * Bootstrap Project Script
 *
 * This script ensures all required directories exist and provides
 * guidance for initial project setup.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Required directory structure
const REQUIRED_DIRS = [
  "input",
  "output/prepared",
  "output/shards",
  "output/exports",
  "output/qa",
  "logs",
  "temp",
  "config",
  "config/migrations",
  "scripts",
  "src",
  "docs",
  "docs/references",
];

// Required files that must exist
const REQUIRED_FILES = [
  "CLAUDE.md",
  "package.json",
  "wrangler.jsonc",
  "tsconfig.json",
  ".env.example",
];

interface BootstrapResult {
  success: boolean;
  createdDirs: string[];
  missingFiles: string[];
  warnings: string[];
}

function ensureDirectory(dirPath: string): boolean {
  const fullPath = path.join(PROJECT_ROOT, dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });

    // Create .gitkeep if it doesn't exist
    const gitkeepPath = path.join(fullPath, ".gitkeep");
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, "");
    }
    return true;
  }
  return false;
}

function checkRequiredFiles(): string[] {
  const missing: string[] = [];
  for (const file of REQUIRED_FILES) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(fullPath)) {
      missing.push(file);
    }
  }
  return missing;
}

function copyEnvExampleIfNeeded(): { success: boolean; message: string } {
  const envExamplePath = path.join(PROJECT_ROOT, ".env.example");
  const envLocalPath = path.join(PROJECT_ROOT, ".env.local");

  if (!fs.existsSync(envExamplePath)) {
    return { success: false, message: ".env.example not found" };
  }

  if (fs.existsSync(envLocalPath)) {
    return { success: true, message: ".env.local already exists" };
  }

  try {
    fs.copyFileSync(envExamplePath, envLocalPath);
    return { success: true, message: "Created .env.local from .env.example" };
  } catch (error) {
    return {
      success: false,
      message: `Failed to copy .env.example: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function printChecklist(): void {
  console.log("\n" + "=".repeat(60));
  console.log("PROJECT SETUP CHECKLIST");
  console.log("=".repeat(60));

  console.log("\n1. Install dependencies:");
  console.log("   npm install");

  console.log("\n2. Configure environment variables:");
  console.log("   Edit .env.local with your actual values:");
  console.log("   - Cloudflare credentials");
  console.log("   - Google Ads developer token and customer ID");
  console.log("   - Google OAuth credentials");
  console.log("   - Google Drive folder IDs");
  console.log("   - Google Sheets spreadsheet ID");

  console.log("\n3. Set up Cloudflare resources:");
  console.log("   wrangler login");
  console.log("   wrangler d1 create word_check_db");
  console.log("   # Update database_id in wrangler.jsonc");
  console.log("   wrangler d1 execute word_check_db --file=config/schema.sql");

  console.log("\n4. Prepare your input data:");
  console.log("   # Place your keyword list in input/ folder:");
  console.log("   # - input/keywords.txt (one word per line)");
  console.log("   # - input/keywords.csv");
  console.log("   npm run prepare-input");

  console.log("\n5. Build shards and initialize storage:");
  console.log("   npm run build-shards");
  console.log("   npm run bootstrap-storage");

  console.log("\n6. Run quality assurance:");
  console.log("   npm run qa");

  console.log("\n" + "=".repeat(60));
}

async function main(): Promise<void> {
  console.log("Word Check Project Bootstrap");
  console.log("=".repeat(60));

  const result: BootstrapResult = {
    success: true,
    createdDirs: [],
    missingFiles: [],
    warnings: [],
  };

  // Ensure required directories
  console.log("\nChecking required directories...");
  for (const dir of REQUIRED_DIRS) {
    if (ensureDirectory(dir)) {
      result.createdDirs.push(dir);
      console.log(`  ✓ Created: ${dir}/`);
    } else {
      console.log(`  ✓ Exists: ${dir}/`);
    }
  }

  // Check required files
  console.log("\nChecking required files...");
  const missingFiles = checkRequiredFiles();
  result.missingFiles = missingFiles;

  if (missingFiles.length === 0) {
    console.log("  ✓ All required files present");
  } else {
    console.log("  ✗ Missing required files:");
    for (const file of missingFiles) {
      console.log(`    - ${file}`);
    }
    result.success = false;
  }

  // Copy .env.example to .env.local if needed
  console.log("\nChecking environment configuration...");
  const envResult = copyEnvExampleIfNeeded();
  console.log(`  ${envResult.success ? "✓" : "✗"} ${envResult.message}`);

  if (!envResult.success) {
    result.warnings.push(envResult.message);
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("BOOTSTRAP SUMMARY");
  console.log("=".repeat(60));

  if (result.createdDirs.length > 0) {
    console.log(`\nCreated ${result.createdDirs.length} directories`);
  }

  if (result.missingFiles.length > 0) {
    console.log(`\n⚠️  Missing ${result.missingFiles.length} required files`);
    result.success = false;
  }

  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  if (result.success) {
    console.log("\n✓ Bootstrap completed successfully!");
  } else {
    console.log("\n✗ Bootstrap completed with errors");
    console.log("  Please address the issues above before proceeding.");
  }

  // Print checklist
  printChecklist();

  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});
