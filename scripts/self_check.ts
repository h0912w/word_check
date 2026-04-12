/**
 * self_check.ts
 * Validates that all required docs, folders, env placeholders, and contract
 * files are present and consistent. Does NOT make any external API calls.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { loadEnv, ROOT } from './lib/env.js';

loadEnv();

let passed = 0;
let failed = 0;

function ok(msg: string): void {
  console.log(`  [pass] ${msg}`);
  passed++;
}

function fail(msg: string): void {
  console.error(`  [fail] ${msg}`);
  failed++;
}

function check(condition: boolean, msg: string): void {
  condition ? ok(msg) : fail(msg);
}

console.log('=== Self Check ===\n');

// ─── 1. Required directories ──────────────────────────────────────────────

console.log('1. Required directories');
for (const dir of [
  'input', 'output/prepared', 'output/shards', 'output/exports',
  'output/manifests', 'output/qa', 'logs', 'temp', 'docs', 'config', 'scripts', 'src',
]) {
  check(existsSync(join(ROOT, dir)), `${dir}/`);
}

// ─── 2. Required docs ─────────────────────────────────────────────────────

console.log('\n2. Required docs');
for (const doc of [
  'docs/architecture.md',
  'docs/deployment.md',
  'docs/operations.md',
  'docs/qa-plan.md',
  'docs/traceability_matrix.md',
  'docs/references/end-to-end-data-contracts.md',
  'docs/references/google-ads-historical-metrics.md',
  'docs/references/cloudflare-workers-cron.md',
  'docs/references/cloudflare-r2-storage.md',
  'docs/references/cloudflare-d1-state.md',
  'docs/references/auth-secrets-model.md',
  'docs/references/google-drive-publishing.md',
  'docs/references/google-sheets-publishing.md',
]) {
  check(existsSync(join(ROOT, doc)), doc);
}

// ─── 3. Required config files ─────────────────────────────────────────────

console.log('\n3. Config files');
for (const f of [
  'config/runtime-limits.json',
  'config/export-schema.json',
  'config/env.template.json',
  'config/d1-schema.sql',
  'wrangler.jsonc',
  'tsconfig.json',
  'package.json',
  '.env.example',
]) {
  check(existsSync(join(ROOT, f)), f);
}

// ─── 4. .env.example placeholder keys ────────────────────────────────────

console.log('\n4. .env.example placeholder keys');
try {
  const envExampleContent = readFileSync(join(ROOT, '.env.example'), 'utf-8');
  const exampleKeys = envExampleContent
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#') && l.includes('='))
    .map((l) => l.split('=')[0].trim());

  for (const key of exampleKeys) {
    check(key.length > 0, `placeholder key: ${key}`);
  }
} catch {
  fail('.env.example could not be read');
}

// ─── 5. export-schema.json columns match src/types.ts contract ────────────

console.log('\n5. Export schema column contract');
try {
  const schema = JSON.parse(readFileSync(join(ROOT, 'config/export-schema.json'), 'utf-8')) as {
    columns: string[];
  };
  const expected = [
    'word', 'avg_monthly_searches', 'competition', 'competition_index',
    'monthly_searches_raw', 'collected_at', 'api_status', 'retry_count',
    'source_shard', 'source_offset', 'input_batch_id', 'export_date',
    'export_batch_id', 'row_key',
  ];
  const missingCols = expected.filter((c) => !schema.columns.includes(c));
  check(missingCols.length === 0, `All 14 required columns in export-schema.json${missingCols.length ? ' (missing: ' + missingCols.join(', ') + ')' : ''}`);
} catch {
  fail('Could not read config/export-schema.json');
}

// ─── 6. wrangler.jsonc bindings ───────────────────────────────────────────

console.log('\n6. wrangler.jsonc bindings');
try {
  // Strip comments from jsonc
  const raw = readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf-8')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const cfg = JSON.parse(raw) as {
    r2_buckets?: { binding: string }[];
    d1_databases?: { binding: string; database_id: string }[];
  };
  check(
    (cfg.r2_buckets ?? []).some((b) => b.binding === 'RESULTS_BUCKET'),
    'wrangler.jsonc has RESULTS_BUCKET R2 binding',
  );
  check(
    (cfg.d1_databases ?? []).some((d) => d.binding === 'STATE_DB'),
    'wrangler.jsonc has STATE_DB D1 binding',
  );
  const d1 = (cfg.d1_databases ?? []).find((d) => d.binding === 'STATE_DB');
  check(
    !!d1?.database_id && d1.database_id !== 'REPLACE_ME',
    'wrangler.jsonc STATE_DB database_id is set (not REPLACE_ME)',
  );
} catch {
  fail('Could not parse wrangler.jsonc');
}

// ─── 7. Source files present ─────────────────────────────────────────────

console.log('\n7. Source files');
for (const f of [
  'src/types.ts', 'src/worker.ts', 'src/batchRunner.ts',
  'src/googleAdsClient.ts', 'src/storage.ts', 'src/responseNormalizer.ts',
  'src/quotaGuard.ts', 'src/exportResults.ts',
]) {
  check(existsSync(join(ROOT, f)), f);
}

// ─── 8. Script files present ─────────────────────────────────────────────

console.log('\n8. Script files');
for (const f of [
  'scripts/bootstrap_project.ts', 'scripts/prepare_input.ts',
  'scripts/build_shards.ts', 'scripts/bootstrap_storage.ts',
  'scripts/export_results.ts', 'scripts/publish_results.ts',
  'scripts/backfill_sheets.ts', 'scripts/run_qa.ts', 'scripts/self_check.ts',
]) {
  check(existsSync(join(ROOT, f)), f);
}

// ─── Summary ─────────────────────────────────────────────────────────────

console.log(`\n=== Self Check Summary ===`);
console.log(`Passed: ${passed}  |  Failed: ${failed}`);

if (failed > 0) {
  console.error(`\n${failed} check(s) failed. Fix issues above before deployment.`);
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
