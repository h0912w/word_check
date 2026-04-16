#!/usr/bin/env tsx

/**
 * Build Shards Script
 *
 * This script splits the normalized word list into smaller shards
 * for batch processing. Each shard is saved as a separate file.
 * A manifest file is created with checksums for validation.
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

interface BuildShardsOptions {
  inputPath?: string;
  shardSize?: number;
  outputDir?: string;
  inputBatchId?: string;
}

interface ShardInfo {
  shard_id: string;
  file_path: string;
  row_count: number;
  checksum: string;
}

interface ShardManifest {
  input_batch_id: string;
  total_rows: number;
  total_shards: number;
  shard_size: number;
  shards: ShardInfo[];
  created_at: string;
}

interface BuildShardsResult {
  success: boolean;
  inputBatchId: string;
  totalRows: number;
  totalShards: number;
  shardSize: number;
  manifestPath: string;
  errors: string[];
}

function calculateChecksum(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readInputBatchId(): string | null {
  const metadataDir = path.join(PROJECT_ROOT, "output/prepared");
  const files = fs.readdirSync(metadataDir);

  for (const file of files) {
    if (file.startsWith("input_batch_") && file.endsWith(".json")) {
      const metadataPath = path.join(metadataDir, file);
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        return metadata.input_batch_id;
      } catch {
        continue;
      }
    }
  }

  return null;
}

async function buildShards(
  options: BuildShardsOptions
): Promise<BuildShardsResult> {
  const result: BuildShardsResult = {
    success: false,
    inputBatchId: "",
    totalRows: 0,
    totalShards: 0,
    shardSize: options.shardSize || 100,
    manifestPath: "",
    errors: [],
  };

  try {
    // Determine input batch ID
    let inputBatchId = options.inputBatchId;
    if (!inputBatchId) {
      inputBatchId = readInputBatchId();
    }
    if (!inputBatchId) {
      result.errors.push("Could not determine input batch ID");
      return result;
    }
    result.inputBatchId = inputBatchId;

    // Determine input path
    const inputPath =
      options.inputPath ||
      path.join(PROJECT_ROOT, "output/prepared/normalized_words.txt");

    if (!fs.existsSync(inputPath)) {
      result.errors.push(`Input file not found: ${inputPath}`);
      return result;
    }

    // Read input file
    console.log(`Reading input file: ${inputPath}`);
    const content = fs.readFileSync(inputPath, "utf-8");
    const words = content.split("\n").filter((w) => w.length > 0);
    result.totalRows = words.length;

    if (words.length === 0) {
      result.errors.push("Input file contains no words");
      return result;
    }

    console.log(`Found ${words.length} words`);

    const shardSize = options.shardSize || 100;
    result.shardSize = shardSize;

    // Determine output directory
    const outputDir = options.outputDir || path.join(PROJECT_ROOT, "output/shards");
    const manifestsDir = path.join(PROJECT_ROOT, "output/manifests");

    // Ensure output directories exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    if (!fs.existsSync(manifestsDir)) {
      fs.mkdirSync(manifestsDir, { recursive: true });
    }

    // Create shards
    const shards: ShardInfo[] = [];
    const totalShards = Math.ceil(words.length / shardSize);
    result.totalShards = totalShards;

    console.log(`Creating ${totalShards} shards (${shardSize} words each)`);

    for (let i = 0; i < totalShards; i++) {
      const shardId = `shard_${String(i + 1).padStart(6, "0")}`;
      const startIdx = i * shardSize;
      const endIdx = Math.min(startIdx + shardSize, words.length);
      const shardWords = words.slice(startIdx, endIdx);

      const shardContent = shardWords.join("\n") + "\n";
      const checksum = calculateChecksum(shardContent);

      const shardFilePath = path.join(outputDir, `${shardId}.txt`);
      fs.writeFileSync(shardFilePath, shardContent, "utf-8");

      shards.push({
        shard_id: shardId,
        file_path: shardFilePath,
        row_count: shardWords.length,
        checksum: checksum,
      });

      console.log(`  Created ${shardId}.txt (${shardWords.length} words)`);
    }

    // Create manifest
    const manifest: ShardManifest = {
      input_batch_id: inputBatchId,
      total_rows: words.length,
      total_shards: totalShards,
      shard_size: shardSize,
      shards: shards,
      created_at: new Date().toISOString(),
    };

    const manifestPath = path.join(manifestsDir, "shard_manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    result.manifestPath = manifestPath;

    console.log(`\nCreated manifest: ${manifestPath}`);

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
Usage: npm run build-shards [options]

Options:
  --input <path>       Path to normalized input file
                       (default: output/prepared/normalized_words.txt)
  --shard-size <n>     Number of words per shard (default: 100)
  --output <path>      Output directory for shards
                       (default: output/shards/)
  --batch-id <id>      Input batch ID (default: auto-detected)

Examples:
  npm run build-shards
  npm run build-shards -- --shard-size 50
  npm run build-shards -- --batch-id batch_20260412_001
`);
}

async function main(): Promise<void> {
  console.log("Word Check - Build Shards");
  console.log("=".repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: BuildShardsOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      case "--input":
        options.inputPath = args[++i];
        break;
      case "--shard-size":
        options.shardSize = parseInt(args[++i], 10);
        if (isNaN(options.shardSize) || options.shardSize < 1) {
          console.error("Invalid shard size");
          process.exit(1);
        }
        break;
      case "--output":
        options.outputDir = args[++i];
        break;
      case "--batch-id":
        options.inputBatchId = args[++i];
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  // Run build shards
  const result = await buildShards(options);

  console.log("\n" + "=".repeat(60));
  console.log("BUILD SHARDS SUMMARY");
  console.log("=".repeat(60));

  if (result.success) {
    console.log(`\n✓ Success!`);
    console.log(`  Input Batch ID: ${result.inputBatchId}`);
    console.log(`  Total Rows: ${result.totalRows}`);
    console.log(`  Total Shards: ${result.totalShards}`);
    console.log(`  Shard Size: ${result.shardSize}`);
    console.log(`  Manifest: ${result.manifestPath}`);
    console.log(`\nNext steps:`);
    console.log(`  npm run bootstrap-storage`);
  } else {
    console.log(`\n✗ Failed!`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Build shards failed:", error);
  process.exit(1);
});
