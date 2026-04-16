#!/usr/bin/env tsx

/**
 * Manual Batch Trigger Script
 *
 * Triggers the actual Worker to process shards using the real Google Ads API.
 * This script runs the Worker in test-scheduled mode to simulate a Cron trigger.
 *
 * Usage:
 *   npm run run-batch
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * Check if shards are ready for processing
 */
function checkShardsReady(): boolean {
  const shardDir = path.join(PROJECT_ROOT, "output/shards");
  if (!fs.existsSync(shardDir)) {
    console.error("❌ Shard directory not found. Run 'npm run build-shards' first.");
    return false;
  }

  const shardFiles = fs.readdirSync(shardDir).filter(f => f.endsWith(".txt"));
  if (shardFiles.length === 0) {
    console.error("❌ No shard files found. Run 'npm run build-shards' first.");
    return false;
  }

  console.log(`✅ Found ${shardFiles.length} shard files ready for processing.`);
  return true;
}

/**
 * Run the Worker in test-scheduled mode
 */
function runWorker(): void {
  console.log("\n🔄 Starting Worker in test-scheduled mode...");
  console.log("This will trigger the scheduled event handler to process pending shards.\n");

  try {
    // Run wrangler dev in test-scheduled mode
    // This will start the dev server and trigger the scheduled event once
    const result = execSync(
      "npx wrangler dev --test-scheduled --port 8787",
      {
        cwd: PROJECT_ROOT,
        stdio: "inherit",
        timeout: 120000, // 2 minutes timeout
      }
    );

    console.log("\n✅ Worker execution completed.");
  } catch (error) {
    console.error("\n❌ Worker execution failed:", error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("Word Check - Manual Batch Execution");
  console.log("=".repeat(60));
  console.log("\nThis script triggers the actual Worker to process shards");
  console.log("using the real Google Ads API.\n");

  // Check prerequisites
  console.log("Checking prerequisites...");

  if (!checkShardsReady()) {
    process.exit(1);
  }

  // Check if .env.local exists
  const envPath = path.join(PROJECT_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("\n❌ .env.local file not found.");
    console.log("   Run 'npm run bootstrap' to set up environment variables.");
    process.exit(1);
  }

  console.log("✅ Environment file found.");

  // Check D1 database is initialized
  console.log("\nℹ️  Make sure D1 database is initialized:");
  console.log("   npm run bootstrap-storage");

  // Run the Worker
  runWorker();

  console.log("\n" + "=".repeat(60));
  console.log("✅ Batch execution complete!");
  console.log();
  console.log("Next steps:");
  console.log("  npm run export            # Create CSV/XLSX exports");
  console.log("  npm run publish           # Publish to Drive and Sheets");
  console.log();
  console.log("💡 To check Worker status:");
  console.log("  curl http://localhost:8787/status");
}

main().catch((error) => {
  console.error("Batch execution failed:", error);
  process.exit(1);
});
