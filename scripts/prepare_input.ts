#!/usr/bin/env tsx

/**
 * Prepare Input Script
 *
 * This script normalizes input files (txt/csv) into a standardized word list.
 * - Removes empty lines
 * - Trims whitespace
 * - Normalizes UTF-8
 * - Preserves duplicates by default (unless --dedupe flag is provided)
 * - Assigns input_batch_id for tracking
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

interface PrepareInputOptions {
  inputFile?: string;
  outputPath?: string;
  dedupe?: boolean;
  inputBatchId?: string;
}

interface PrepareInputResult {
  success: boolean;
  inputBatchId: string;
  inputRows: number;
  outputRows: number;
  duplicatesRemoved: number;
  outputPath: string;
  errors: string[];
}

function generateInputBatchId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `batch_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

function normalizeText(text: string): string {
  // Normalize to NFC form
  let normalized = text.normalize("NFC");
  // Trim whitespace
  normalized = normalized.trim();
  return normalized;
}

async function readInputFile(filePath: string): Promise<string[]> {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, "utf-8");

  if (ext === ".csv") {
    // Parse CSV and extract words from first column
    const records = parse(content, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    });

    // Flatten array and extract strings
    const words: string[] = [];
    for (const record of records) {
      if (Array.isArray(record)) {
        for (const field of record) {
          if (typeof field === "string" && field.length > 0) {
            words.push(field);
          }
        }
      } else if (typeof record === "string" && record.length > 0) {
        words.push(record);
      }
    }
    return words;
  } else {
    // Treat as plain text (one word per line)
    return content.split("\n");
  }
}

function processWords(
  words: string[],
  options: PrepareInputOptions
): { processedWords: string[]; duplicatesRemoved: number } {
  const seen = new Set<string>();
  const processed: string[] = [];
  let duplicatesRemoved = 0;

  for (const word of words) {
    const normalized = normalizeText(word);

    // Skip empty lines
    if (normalized.length === 0) {
      continue;
    }

    // Handle deduplication if requested
    if (options.dedupe) {
      if (seen.has(normalized)) {
        duplicatesRemoved++;
        continue;
      }
      seen.add(normalized);
    }

    processed.push(normalized);
  }

  return { processedWords: processed, duplicatesRemoved };
}

async function prepareInput(
  options: PrepareInputOptions
): Promise<PrepareInputResult> {
  const result: PrepareInputResult = {
    success: false,
    inputBatchId: options.inputBatchId || generateInputBatchId(),
    inputRows: 0,
    outputRows: 0,
    duplicatesRemoved: 0,
    outputPath: "",
    errors: [],
  };

  try {
    // Determine input file
    let inputFile: string;
    if (options.inputFile) {
      inputFile = options.inputFile;
    } else {
      // Find first txt or csv file in input directory
      const inputDir = path.join(PROJECT_ROOT, "input");
      const files = fs.readdirSync(inputDir);
      const found = files.find(
        (f) => f.endsWith(".txt") || f.endsWith(".csv")
      );

      if (!found) {
        result.errors.push("No input file found in input/ directory");
        return result;
      }
      inputFile = path.join(inputDir, found);
    }

    // Read input file
    console.log(`Reading input file: ${inputFile}`);
    const words = await readInputFile(inputFile);
    result.inputRows = words.length;

    if (words.length === 0) {
      result.errors.push("Input file contains no words");
      return result;
    }

    console.log(`Found ${words.length} words in input file`);

    // Process words
    const { processedWords, duplicatesRemoved } = processWords(words, options);
    result.duplicatesRemoved = duplicatesRemoved;
    result.outputRows = processedWords.length;

    console.log(`Processed ${processedWords.length} words`);
    if (duplicatesRemoved > 0) {
      console.log(`Removed ${duplicatesRemoved} duplicates`);
    }

    // Determine output path
    const outputPath =
      options.outputPath ||
      path.join(PROJECT_ROOT, "output/prepared/normalized_words.txt");
    result.outputPath = outputPath;

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output file
    const outputContent = processedWords.join("\n") + "\n";
    fs.writeFileSync(outputPath, outputContent, "utf-8");

    console.log(`Wrote normalized words to: ${outputPath}`);

    // Write metadata
    const metadataPath = path.join(
      outputDir,
      `input_batch_${result.inputBatchId}.json`
    );
    const metadata = {
      input_batch_id: result.inputBatchId,
      source_file: path.basename(inputFile),
      input_rows: result.inputRows,
      output_rows: result.outputRows,
      duplicates_removed: duplicatesRemoved,
      normalized: true,
      created_at: new Date().toISOString(),
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

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
Usage: npm run prepare-input [options]

Options:
  --input <path>       Path to input file (default: first .txt or .csv in input/)
  --output <path>      Path to output file (default: output/prepared/normalized_words.txt)
  --dedupe             Remove duplicate words
  --batch-id <id>      Custom input batch ID (default: auto-generated)

Examples:
  npm run prepare-input
  npm run prepare-input -- --input input/keywords.txt
  npm run prepare-input -- --input input/keywords.csv --dedupe
  npm run prepare-input -- --batch-id batch_20260412_custom
`);
}

async function main(): Promise<void> {
  console.log("Word Check - Prepare Input");
  console.log("=".repeat(60));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: PrepareInputOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      case "--input":
        options.inputFile = args[++i];
        break;
      case "--output":
        options.outputPath = args[++i];
        break;
      case "--dedupe":
        options.dedupe = true;
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

  // Run prepare input
  const result = await prepareInput(options);

  console.log("\n" + "=".repeat(60));
  console.log("PREPARE INPUT SUMMARY");
  console.log("=".repeat(60));

  if (result.success) {
    console.log(`\n✓ Success!`);
    console.log(`  Input Batch ID: ${result.inputBatchId}`);
    console.log(`  Input Rows: ${result.inputRows}`);
    console.log(`  Output Rows: ${result.outputRows}`);
    if (result.duplicatesRemoved > 0) {
      console.log(`  Duplicates Removed: ${result.duplicatesRemoved}`);
    }
    console.log(`  Output File: ${result.outputPath}`);
    console.log(`\nNext steps:`);
    console.log(`  npm run build-shards`);
  } else {
    console.log(`\n✗ Failed!`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Prepare input failed:", error);
  process.exit(1);
});
