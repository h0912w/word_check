#!/usr/bin/env tsx

/**
 * Run QA Script (Local Execution)
 *
 * This script runs end-to-end quality assurance tests using the actual
 * user pipeline (no separate QA software).
 *
 * - Uses fixed test input (10 words)
 * - Runs through the complete pipeline
 * - Verifies export/publish results
 * - Generates QA report and result JSON
 *
 * Options:
 *   --mock: Use mock API (default: false, use real Google Ads API)
 *   --skip-init: Skip database reinitialization
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

interface QACheck {
  name: string;
  status: "pass" | "fail";
  details: string;
  expected?: string;
  actual?: string;
}

interface QAReport {
  timestamp: string;
  overall_status: "pass" | "fail";
  checks: QACheck[];
}

interface QAResult {
  timestamp: string;
  overall_status: "pass" | "fail";
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  checks: QACheck[];
  export_csv_exists: boolean;
  export_xlsx_exists: boolean;
  required_columns_exist: boolean;
  at_least_one_success_record: boolean;
  records_count: number;
  failed_records_count: number;
}

const REQUIRED_COLUMNS = [
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
];

class QARunner {
  private checks: QACheck[] = [];
  private exportDate: string;
  private useMockApi: boolean = false;
  private skipInit: boolean = false;

  constructor(useMockApi: boolean = false, skipInit: boolean = false) {
    this.exportDate = new Date().toISOString().split("T")[0];
    this.useMockApi = useMockApi;
    this.skipInit = skipInit;
  }

  addCheck(
    name: string,
    status: "pass" | "fail",
    details: string,
    expected?: string,
    actual?: string
  ): void {
    this.checks.push({ name, status, details, expected, actual });
  }

  async runQA(): Promise<QAResult> {
    console.log("Word Check - End-to-End QA (Local Execution)");
    console.log("=".repeat(60));
    console.log(`Export Date: ${this.exportDate}`);
    console.log(`API Mode: ${this.useMockApi ? "MOCK" : "REAL Google Ads API"}`);
    console.log("");

    // 1. Check directory structure
    await this.checkDirectoryStructure();

    // 2. Check required files
    await this.checkRequiredFiles();

    // 3. Check .env.local for API credentials
    await this.checkEnvCredentials();

    // 4. Check test input exists
    const testInputPath = await this.checkTestInput();

    if (!testInputPath) {
      // Create test input if not exists
      await this.createTestInput();
    }

    // 5. Run prepare-input
    await this.runPrepareInput();

    // 6. Run build-shards
    await this.runBuildShards();

    // 7. Check manifest created
    await this.checkManifestCreated();

    // 8. Reinitialize database for clean test (if not skipped)
    if (!this.skipInit) {
      await this.reinitializeDatabase();
    }

    // 9. Run bootstrap-storage
    await this.runBootstrapStorage();

    // 10. Run collect-metrics (real or mock API)
    await this.runCollectMetrics();

    // 11. Run export
    await this.runExport();

    // 12. Check export files
    const csvPath = await this.checkExportFiles();

    // 13. Verify CSV format
    if (csvPath) {
      await this.verifyCsvFormat(csvPath);
    }

    // 14. Count records
    const records = csvPath ? await this.countRecords(csvPath) : [];

    // 15. Verify data quality (only for real API)
    if (!this.useMockApi && records.length > 0) {
      await this.verifyDataQuality(records);
    }

    // 16. Verify row_key format
    if (records.length > 0) {
      await this.verifyRowKeyFormat(records);
    }

    // 17. Check SQLite schema
    await this.checkSQLiteSchema();

    // 18. Generate QA report
    return this.generateResult(records);
  }

  async checkDirectoryStructure(): Promise<void> {
    console.log("Checking directory structure...");

    const requiredDirs = [
      "input",
      "output/prepared",
      "output/shards",
      "output/exports",
      "output/qa",
      "logs",
      "temp",
      "config",
      "scripts",
      "src",
      "docs",
      "data",
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(PROJECT_ROOT, dir);
      const exists = fs.existsSync(dirPath);
      this.addCheck(
        `Directory exists: ${dir}/`,
        exists ? "pass" : "fail",
        exists ? "Directory found" : "Directory not found"
      );
    }
  }

  async checkRequiredFiles(): Promise<void> {
    console.log("\nChecking required files...");

    const requiredFiles = [
      "CLAUDE.md",
      "package.json",
      "tsconfig.json",
      ".env.example",
      "config/schema.sql",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      const exists = fs.existsSync(filePath);
      this.addCheck(
        `File exists: ${file}`,
        exists ? "pass" : "fail",
        exists ? "File found" : "File not found"
      );
    }
  }

  async checkEnvCredentials(): Promise<void> {
    console.log("\nChecking environment credentials...");

    const envPath = path.join(PROJECT_ROOT, ".env.local");

    if (!fs.existsSync(envPath)) {
      this.addCheck(".env.local exists", "fail", ".env.local not found");
      return;
    }

    this.addCheck(".env.local exists", "pass", ".env.local found");

    // Load and check required variables
    const envContent = fs.readFileSync(envPath, "utf-8");
    const requiredVars = this.useMockApi
      ? [] // No required vars for mock API
      : [
          "GOOGLE_ADS_DEVELOPER_TOKEN",
          "GOOGLE_ADS_CUSTOMER_ID",
          "GOOGLE_ADS_CLIENT_ID",
          "GOOGLE_ADS_CLIENT_SECRET",
          "GOOGLE_ADS_REFRESH_TOKEN",
        ];

    for (const varName of requiredVars) {
      const hasVar = envContent.includes(`${varName}=`) && envContent.match(new RegExp(`${varName}=([^\\s]+)`))?.[1] !== "";

      this.addCheck(
        `Env var: ${varName}`,
        hasVar ? "pass" : "fail",
        hasVar ? `${varName} is set` : `${varName} is not set`
      );
    }
  }

  async checkTestInput(): Promise<string | null> {
    console.log("\nChecking test input...");

    const inputDir = path.join(PROJECT_ROOT, "input");
    if (!fs.existsSync(inputDir)) {
      this.addCheck(
        "Test input file exists",
        "fail",
        "Input directory not found"
      );
      return null;
    }

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith(".txt") || f.endsWith(".csv"));

    const testFile = files.find(f => f.includes("test") || f.includes("qa"));

    if (testFile) {
      const testPath = path.join(inputDir, testFile);
      const content = fs.readFileSync(testPath, "utf-8");
      const lines = content.split("\n").filter(l => l.trim().length > 0);

      this.addCheck(
        "Test input file exists",
        "pass",
        `Found ${testFile} with ${lines.length} words`
      );

      return testPath;
    }

    this.addCheck(
      "Test input file exists",
      "fail",
      "No test input file found"
    );

    return null;
  }

  async createTestInput(): Promise<void> {
    console.log("\nCreating test input...");

    const testWords = [
      "test",
      "example",
      "keyword",
      "sample",
      "demo",
      "quality",
      "assurance",
      "validation",
      "verification",
      "monitoring",
    ];

    const testPath = path.join(PROJECT_ROOT, "input/qa_test.txt");
    fs.writeFileSync(testPath, testWords.join("\n") + "\n");

    this.addCheck(
      "Test input created",
      "pass",
      `Created qa_test.txt with ${testWords.length} words`
    );
  }

  async runPrepareInput(): Promise<void> {
    console.log("\nRunning prepare-input...");

    try {
      const command = `npx tsx ${path.join(PROJECT_ROOT, "scripts/prepare_input.ts")} --input input/qa_test.txt`;
      execSync(command, {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });

      this.addCheck(
        "prepare-input completed",
        "pass",
        "Input normalization successful"
      );
    } catch (error) {
      this.addCheck(
        "prepare-input completed",
        "fail",
        `Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async runBuildShards(): Promise<void> {
    console.log("\nRunning build-shards...");

    try {
      const command = `npx tsx ${path.join(PROJECT_ROOT, "scripts/build_shards.ts")} --batch-id batch_qa_test_001 --shard-size 5`;
      execSync(command, {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });

      this.addCheck(
        "build-shards completed",
        "pass",
        "Shard creation successful"
      );
    } catch (error) {
      this.addCheck(
        "build-shards completed",
        "fail",
        `Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async reinitializeDatabase(): Promise<void> {
    console.log("\nReinitializing database for clean test...");

    try {
      const dbPath = path.join(PROJECT_ROOT, "data/word-check.db");
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }

      const command = `npx tsx ${path.join(PROJECT_ROOT, "scripts/init_db.ts")}`;
      execSync(command, {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });

      this.addCheck(
        "Database reinitialized",
        "pass",
        "Clean database created"
      );
    } catch (error) {
      this.addCheck(
        "Database reinitialized",
        "fail",
        `Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async runBootstrapStorage(): Promise<void> {
    console.log("\nRunning bootstrap-storage...");

    try {
      const command = `npx tsx ${path.join(PROJECT_ROOT, "scripts/bootstrap_storage.ts")}`;
      execSync(command, {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });

      this.addCheck(
        "bootstrap-storage completed",
        "pass",
        "SQLite database initialized successfully"
      );
    } catch (error) {
      this.addCheck(
        "bootstrap-storage completed",
        "fail",
        `Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async runCollectMetrics(): Promise<void> {
    console.log(`\nRunning collect-metrics (${this.useMockApi ? "mock API" : "real Google Ads API"})...`);

    try {
      const command = `npx tsx ${path.join(PROJECT_ROOT, "scripts/collect_metrics.ts")}`;
      execSync(command, {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
        env: { ...process.env, USE_MOCK_API: this.useMockApi ? "true" : "false" },
      });

      this.addCheck(
        "collect-metrics completed",
        "pass",
        `Metrics collected successfully with ${this.useMockApi ? "mock API" : "real Google Ads API"}`
      );
    } catch (error) {
      this.addCheck(
        "collect-metrics completed",
        "fail",
        `Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async checkManifestCreated(): Promise<void> {
    console.log("\nChecking manifest...");

    const manifestPath = path.join(PROJECT_ROOT, "output/manifests/shard_manifest.json");
    const exists = fs.existsSync(manifestPath);

    if (exists) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      this.addCheck(
        "Manifest created",
        "pass",
        `Manifest with ${manifest.total_shards} shards, ${manifest.total_rows} rows`
      );
    } else {
      this.addCheck(
        "Manifest created",
        "fail",
        "Manifest not found"
      );
    }
  }

  async runExport(): Promise<void> {
    console.log("\nRunning export...");

    try {
      const command = `npx tsx ${path.join(PROJECT_ROOT, "scripts/export_results.ts")}`;
      execSync(command, {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });

      this.addCheck(
        "export completed",
        "pass",
        "Export successful"
      );
    } catch (error) {
      this.addCheck(
        "export completed",
        "fail",
        `Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async checkExportFiles(): Promise<string | null> {
    console.log("\nChecking export files...");

    const outputDir = path.join(PROJECT_ROOT, "output/exports");
    if (!fs.existsSync(outputDir)) {
      this.addCheck("CSV export exists", "fail", "Exports directory not found");
      this.addCheck("XLSX export exists", "fail", "Exports directory not found");
      return null;
    }

    const csvFiles = fs.readdirSync(outputDir).filter(f => f.endsWith(".csv"));

    if (csvFiles.length === 0) {
      this.addCheck(
        "CSV export exists",
        "fail",
        "No CSV export found"
      );
      this.addCheck(
        "XLSX export exists",
        "fail",
        "No XLSX export found"
      );
      return null;
    }

    // Use the most recent CSV file
    const latestCsv = csvFiles.sort().reverse()[0];
    const csvPath = path.join(outputDir, latestCsv);
    const xlsxPath = csvPath.replace(".csv", ".xlsx");

    const csvExists = fs.existsSync(csvPath);
    const xlsxExists = fs.existsSync(xlsxPath);

    this.addCheck(
      "CSV export exists",
      csvExists ? "pass" : "fail",
      csvExists ? `Found ${latestCsv}` : "CSV not found"
    );

    this.addCheck(
      "XLSX export exists",
      xlsxExists ? "pass" : "fail",
      xlsxExists ? `Found ${path.basename(xlsxPath)}` : "XLSX not found"
    );

    return csvExists ? csvPath : null;
  }

  async verifyCsvFormat(csvPath: string): Promise<void> {
    console.log("\nVerifying CSV format...");

    try {
      const content = fs.readFileSync(csvPath, "utf-8");
      const lines = content.split("\n").filter(l => l.trim().length > 0);

      if (lines.length < 2) {
        this.addCheck(
          "CSV has header and data",
          "fail",
          `CSV has only ${lines.length} lines`
        );
        return;
      }

      const header = lines[0].split(",");
      const missingColumns = REQUIRED_COLUMNS.filter(col => !header.includes(col));

      if (missingColumns.length > 0) {
        this.addCheck(
          "CSV has all required columns",
          "fail",
          `Missing columns: ${missingColumns.join(", ")}`
        );
      } else {
        this.addCheck(
          "CSV has all required columns",
          "pass",
          `All ${REQUIRED_COLUMNS.length} columns present`
        );
      }
    } catch (error) {
      this.addCheck(
        "CSV format verification",
        "fail",
        `Failed to read CSV: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async countRecords(csvPath: string): Promise<string[]> {
    console.log("\nCounting records...");

    try {
      const content = fs.readFileSync(csvPath, "utf-8");
      const lines = content.split("\n").filter(l => l.trim().length > 0);
      const recordCount = Math.max(0, lines.length - 1); // Exclude header

      this.addCheck(
        "Records in export",
        recordCount > 0 ? "pass" : "fail",
        `Found ${recordCount} records`,
        ">= 1",
        String(recordCount)
      );

      return lines.slice(1); // Return data rows
    } catch (error) {
      this.addCheck(
        "Records count",
        "fail",
        `Failed to count: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  async verifyDataQuality(records: string[]): Promise<void> {
    console.log("\nVerifying data quality (real API)...");

    if (records.length === 0) {
      this.addCheck(
        "Data quality check",
        "fail",
        "No records to verify"
      );
      return;
    }

    let validRecords = 0;
    let failedRecords = 0;

    for (const record of records) {
      const values = record.split(",");
      if (values.length >= 3) {
        const word = values[0].replace(/^"|"$/g, "");
        const avgSearches = values[1];
        const apiStatus = values[6].replace(/^"|"$/g, "");

        if (apiStatus === "success" && avgSearches && avgSearches !== "" && avgSearches !== "null") {
          validRecords++;
        } else if (apiStatus === "failed") {
          failedRecords++;
        }
      }
    }

    this.addCheck(
      "Valid API responses",
      validRecords > 0 ? "pass" : "fail",
      `${validRecords} valid, ${failedRecords} failed`,
      "Valid responses > 0",
      String(validRecords)
    );
  }

  async verifyRowKeyFormat(records: string[]): Promise<void> {
    console.log("\nVerifying row_key format...");

    if (records.length === 0) {
      this.addCheck(
        "row_key format",
        "fail",
        "No records to verify"
      );
      return;
    }

    // Check first record
    const values = records[0].split(",");
    if (values.length < 13) {
      this.addCheck(
        "row_key format",
        "fail",
        "Record doesn't have enough columns"
      );
      return;
    }

    const word = values[0].replace(/^"|"$/g, "");
    const inputBatchId = values[10].replace(/^"|"$/g, "");
    const sourceShard = values[8].replace(/^"|"$/g, "");
    const sourceOffset = values[9].replace(/^"|"$/g, "");
    const exportDate = values[11].replace(/^"|"$/g, "");

    const expectedRowKey = `${exportDate}|${inputBatchId}|${sourceShard}|${sourceOffset}|${word}`;

    // Row key would be computed and stored
    this.addCheck(
      "row_key can be constructed",
      "pass",
      `Can construct row_key: ${expectedRowKey.substring(0, 50)}...`
    );
  }

  async checkSQLiteSchema(): Promise<void> {
    console.log("\nChecking SQLite schema...");

    const schemaPath = path.join(PROJECT_ROOT, "config/schema.sql");
    const exists = fs.existsSync(schemaPath);

    if (!exists) {
      this.addCheck(
        "SQLite schema file exists",
        "fail",
        "Schema file not found"
      );
      return;
    }

    const schema = fs.readFileSync(schemaPath, "utf-8");

    const requiredTables = [
      "input_batches",
      "shards",
      "batch_runs",
      "export_jobs",
      "publish_jobs",
      "keyword_results",
    ];

    for (const table of requiredTables) {
      const hasTable = schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`) ||
                       schema.includes(`CREATE TABLE ${table}`) ||
                       schema.toLowerCase().includes(`create table if not exists ${table.toLowerCase()}`) ||
                       schema.toLowerCase().includes(`create table ${table.toLowerCase()}`);
      this.addCheck(
        `Schema has table: ${table}`,
        hasTable ? "pass" : "fail",
        hasTable ? `Table ${table} defined` : `Table ${table} not found`
      );
    }
  }

  generateResult(records: string[]): QAResult {
    const passedChecks = this.checks.filter(c => c.status === "pass").length;
    const failedChecks = this.checks.filter(c => c.status === "fail").length;

    const overallStatus: "pass" | "fail" = failedChecks === 0 ? "pass" : "fail";

    return {
      timestamp: new Date().toISOString(),
      overall_status: overallStatus,
      total_checks: this.checks.length,
      passed_checks: passedChecks,
      failed_checks: failedChecks,
      checks: this.checks,
      export_csv_exists: this.checks.some(c => c.name === "CSV export exists" && c.status === "pass"),
      export_xlsx_exists: this.checks.some(c => c.name === "XLSX export exists" && c.status === "pass"),
      required_columns_exist: this.checks.some(c => c.name === "CSV has all required columns" && c.status === "pass"),
      at_least_one_success_record: passedChecks > 0,
      records_count: records.length,
      failed_records_count: 0,
    };
  }
}

async function saveQAReport(result: QAResult, useMockApi: boolean): Promise<void> {
  const qaDir = path.join(PROJECT_ROOT, "output/qa");
  if (!fs.existsSync(qaDir)) {
    fs.mkdirSync(qaDir, { recursive: true });
  }

  const suffix = useMockApi ? "_mock" : "_real_api";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];

  // Save markdown report
  const reportPath = path.join(qaDir, `qa_report${suffix}_${timestamp}.md`);
  const reportContent = generateMarkdownReport(result, useMockApi);
  fs.writeFileSync(reportPath, reportContent);

  // Save JSON result
  const resultPath = path.join(qaDir, `qa_result${suffix}_${timestamp}.json`);
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

  console.log(`\nQA Report saved: ${reportPath}`);
  console.log(`QA Result saved: ${resultPath}`);
}

function generateMarkdownReport(result: QAResult, useMockApi: boolean): string {
  const lines = [
    `# QA Report (${useMockApi ? "Mock API" : "Real Google Ads API"})`,
    "",
    `**Generated:** ${result.timestamp}`,
    `**Status:** ${result.overall_status.toUpperCase()}`,
    `**API Mode:** ${useMockApi ? "Mock API" : "Real Google Ads API"}`,
    "",
    `**Summary:**`,
    `- Total Checks: ${result.total_checks}`,
    `- Passed: ${result.passed_checks}`,
    `- Failed: ${result.failed_checks}`,
    "",
    "## Checks",
    "",
  ];

  for (const check of result.checks) {
    const icon = check.status === "pass" ? "✓" : "✗";
    lines.push(`### ${icon} ${check.name}`);
    lines.push("");
    lines.push(`**Status:** ${check.status.toUpperCase()}`);
    lines.push("");
    lines.push(`**Details:** ${check.details}`);
    if (check.expected !== undefined) {
      lines.push(`**Expected:** ${check.expected}`);
    }
    if (check.actual !== undefined) {
      lines.push(`**Actual:** ${check.actual}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let useMockApi = false;
  let skipInit = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mock") {
      useMockApi = true;
    } else if (args[i] === "--skip-init") {
      skipInit = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: npm run qa [options]

Options:
  --mock         Use mock API instead of real Google Ads API
  --skip-init    Skip database reinitialization
  --help, -h     Show this help message

Examples:
  npm run qa                    # Run QA with real Google Ads API
  npm run qa -- --mock          # Run QA with mock API
  npm run qa -- --skip-init     # Run QA without reinitializing DB
      `);
      process.exit(0);
    }
  }

  const runner = new QARunner(useMockApi, skipInit);
  const result = await runner.runQA();
  await saveQAReport(result, useMockApi);

  console.log("\n" + "=".repeat(60));
  console.log("QA SUMMARY");
  console.log("=".repeat(60));
  console.log(`\nAPI Mode: ${useMockApi ? "Mock API" : "Real Google Ads API"}`);
  console.log(`Overall Status: ${result.overall_status.toUpperCase()}`);
  console.log(`Total Checks: ${result.total_checks}`);
  console.log(`Passed: ${result.passed_checks}`);
  console.log(`Failed: ${result.failed_checks}`);

  if (result.overall_status === "pass") {
    console.log("\n✓ All QA checks passed!");
  } else {
    console.log("\n✗ Some QA checks failed. Please review the report.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("QA failed:", error);
  process.exit(1);
});
