import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '..', '..');

let loaded = false;

/** Load .env.local (if present) into process.env. Call once at script startup. */
export function loadEnv(): void {
  if (loaded) return;
  loaded = true;

  const envPath = join(ROOT, '.env.local');
  if (!existsSync(envPath)) {
    console.warn('[env] .env.local not found — using existing environment variables only.');
    return;
  }

  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

/** Require an env variable or throw a clear error. */
export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Required environment variable ${key} is not set. Fill in .env.local.`);
  return val;
}

/** Return an env variable or a default value. */
export function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}
