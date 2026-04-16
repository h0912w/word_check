# QA Report (Real Google Ads API)

**Generated:** 2026-04-13T23:15:25.861Z
**Status:** FAIL
**API Mode:** Real Google Ads API

**Summary:**
- Total Checks: 41
- Passed: 39
- Failed: 2

## Checks

### ✓ Directory exists: input/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: output/prepared/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: output/shards/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: output/exports/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: output/qa/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: logs/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: temp/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: config/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: scripts/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: src/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: docs/

**Status:** PASS

**Details:** Directory found

### ✓ Directory exists: data/

**Status:** PASS

**Details:** Directory found

### ✓ File exists: CLAUDE.md

**Status:** PASS

**Details:** File found

### ✓ File exists: package.json

**Status:** PASS

**Details:** File found

### ✓ File exists: tsconfig.json

**Status:** PASS

**Details:** File found

### ✓ File exists: .env.example

**Status:** PASS

**Details:** File found

### ✓ File exists: config/schema.sql

**Status:** PASS

**Details:** File found

### ✓ .env.local exists

**Status:** PASS

**Details:** .env.local found

### ✓ Env var: GOOGLE_ADS_DEVELOPER_TOKEN

**Status:** PASS

**Details:** GOOGLE_ADS_DEVELOPER_TOKEN is set

### ✓ Env var: GOOGLE_ADS_CUSTOMER_ID

**Status:** PASS

**Details:** GOOGLE_ADS_CUSTOMER_ID is set

### ✓ Env var: GOOGLE_ADS_CLIENT_ID

**Status:** PASS

**Details:** GOOGLE_ADS_CLIENT_ID is set

### ✓ Env var: GOOGLE_ADS_CLIENT_SECRET

**Status:** PASS

**Details:** GOOGLE_ADS_CLIENT_SECRET is set

### ✓ Env var: GOOGLE_ADS_REFRESH_TOKEN

**Status:** PASS

**Details:** GOOGLE_ADS_REFRESH_TOKEN is set

### ✓ Test input file exists

**Status:** PASS

**Details:** Found qa_test.txt with 10 words

### ✓ prepare-input completed

**Status:** PASS

**Details:** Input normalization successful

### ✓ build-shards completed

**Status:** PASS

**Details:** Shard creation successful

### ✓ Manifest created

**Status:** PASS

**Details:** Manifest with 2 shards, 10 rows

### ✓ Database reinitialized

**Status:** PASS

**Details:** Clean database created

### ✓ bootstrap-storage completed

**Status:** PASS

**Details:** SQLite database initialized successfully

### ✓ collect-metrics completed

**Status:** PASS

**Details:** Metrics collected successfully with real Google Ads API

### ✓ export completed

**Status:** PASS

**Details:** Export successful

### ✓ CSV export exists

**Status:** PASS

**Details:** Found keyword_metrics_2026-04-14.csv

### ✓ XLSX export exists

**Status:** PASS

**Details:** Found keyword_metrics_2026-04-14.xlsx

### ✗ CSV has header and data

**Status:** FAIL

**Details:** CSV has only 1 lines

### ✗ Records in export

**Status:** FAIL

**Details:** Found 0 records
**Expected:** >= 1
**Actual:** 0

### ✓ Schema has table: input_batches

**Status:** PASS

**Details:** Table input_batches defined

### ✓ Schema has table: shards

**Status:** PASS

**Details:** Table shards defined

### ✓ Schema has table: batch_runs

**Status:** PASS

**Details:** Table batch_runs defined

### ✓ Schema has table: export_jobs

**Status:** PASS

**Details:** Table export_jobs defined

### ✓ Schema has table: publish_jobs

**Status:** PASS

**Details:** Table publish_jobs defined

### ✓ Schema has table: keyword_results

**Status:** PASS

**Details:** Table keyword_results defined
