import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { loadEnv, ROOT } from './lib/env.js';

loadEnv();

const REQUIRED_DIRS = [
  'input',
  'output',
  'output/prepared',
  'output/shards',
  'output/exports',
  'output/manifests',
  'output/qa',
  'logs',
  'temp',
  'docs',
  'config',
  'scripts',
  'src',
];

const REQUIRED_DOCS = [
  'docs/architecture.md',
  'docs/deployment.md',
  'docs/operations.md',
  'docs/qa-plan.md',
  'docs/traceability_matrix.md',
];

const CONFIG_FILES = [
  'config/runtime-limits.json',
  'config/export-schema.json',
  'config/env.template.json',
];

console.log('=== Bootstrap Project ===\n');

let allOk = true;

// 1. Required directories
console.log('1. Checking required directories...');
for (const dir of REQUIRED_DIRS) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) {
    mkdirSync(full, { recursive: true });
    console.log(`  [created] ${dir}`);
  } else {
    console.log(`  [ok]      ${dir}`);
  }
}

// 2. .env.local
console.log('\n2. Checking .env.local...');
const envLocal = join(ROOT, '.env.local');
const envExample = join(ROOT, '.env.example');
if (!existsSync(envLocal)) {
  if (existsSync(envExample)) {
    copyFileSync(envExample, envLocal);
    console.log('  [created] .env.local (copied from .env.example) — fill in your secrets.');
  } else {
    console.warn('  [warn]    .env.example not found.');
    allOk = false;
  }
} else {
  console.log('  [ok]      .env.local exists');
}

// 3. Required docs
console.log('\n3. Checking required docs...');
for (const doc of REQUIRED_DOCS) {
  const full = join(ROOT, doc);
  if (!existsSync(full)) {
    console.warn(`  [missing] ${doc}`);
    allOk = false;
  } else {
    console.log(`  [ok]      ${doc}`);
  }
}

// 4. Config files
console.log('\n4. Checking config files...');
for (const cfg of CONFIG_FILES) {
  const full = join(ROOT, cfg);
  if (!existsSync(full)) {
    console.warn(`  [missing] ${cfg}`);
    allOk = false;
  } else {
    console.log(`  [ok]      ${cfg}`);
  }
}

// 5. Required env vars check (non-fatal warning)
console.log('\n5. Checking required secrets in .env.local...');
try {
  const template = JSON.parse(readFileSync(join(ROOT, 'config/env.template.json'), 'utf-8')) as {
    requiredSecrets: string[];
  };
  let missingAny = false;
  for (const key of template.requiredSecrets) {
    if (!process.env[key]) {
      console.warn(`  [empty]   ${key} — fill in .env.local`);
      missingAny = true;
    } else {
      console.log(`  [set]     ${key}`);
    }
  }
  if (missingAny) {
    console.log('\n  Note: Complete .env.local before running bootstrap-storage or beyond.');
  }
} catch {
  console.warn('  [warn] Could not read config/env.template.json');
}

console.log('\n=== Bootstrap Result ===');
if (allOk) {
  console.log('Bootstrap complete. Next step: npm run prepare-input');
} else {
  console.log('Bootstrap completed with warnings. Resolve issues above before proceeding.');
  process.exit(1);
}
