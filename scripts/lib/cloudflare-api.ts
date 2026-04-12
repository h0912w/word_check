import { requireEnv } from './env.js';

function cfHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${requireEnv('CLOUDFLARE_API_TOKEN')}`,
    'Content-Type': 'application/json',
  };
}

function accountId(): string {
  return requireEnv('CLOUDFLARE_ACCOUNT_ID');
}

function d1DatabaseId(): string {
  return requireEnv('CLOUDFLARE_D1_DATABASE_ID');
}

function r2BucketName(): string {
  return requireEnv('R2_BUCKET_NAME');
}

// ─── D1 ──────────────────────────────────────────────────────────────────────

interface D1Result {
  results?: Record<string, unknown>[];
  success: boolean;
  errors?: { code: number; message: string }[];
}

export async function d1Query(sql: string, params: unknown[] = []): Promise<D1Result> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId()}/d1/database/${d1DatabaseId()}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: cfHeaders(),
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) {
    throw new Error(`D1 API error ${res.status}: ${await res.text()}`);
  }
  const body = await res.json() as { result: D1Result[] };
  const result = body.result?.[0];
  if (!result?.success) {
    const errMsg = result?.errors?.map((e) => e.message).join('; ') ?? 'unknown error';
    throw new Error(`D1 query failed: ${errMsg}`);
  }
  return result;
}

export async function d1Execute(statements: { sql: string; params?: unknown[] }[]): Promise<void> {
  for (const stmt of statements) {
    await d1Query(stmt.sql, stmt.params ?? []);
  }
}

// ─── R2 ──────────────────────────────────────────────────────────────────────

/**
 * Upload an object to R2 via Cloudflare REST API.
 * key: object key (e.g. "inputs/batch_001/shards/shard_000001.txt")
 */
export async function r2Put(
  key: string,
  body: string | Uint8Array,
  contentType = 'application/octet-stream',
): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId()}/r2/buckets/${r2BucketName()}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${requireEnv('CLOUDFLARE_API_TOKEN')}`,
      'Content-Type': contentType,
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`R2 PUT failed for key "${key}": ${res.status} ${await res.text()}`);
  }
}

/** Download a text object from R2. Returns null if not found. */
export async function r2Get(key: string): Promise<string | null> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId()}/r2/buckets/${r2BucketName()}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${requireEnv('CLOUDFLARE_API_TOKEN')}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 GET failed for key "${key}": ${res.status}`);
  return res.text();
}

/** List object keys in R2 under a given prefix. */
export async function r2List(prefix: string): Promise<string[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId()}/r2/buckets/${r2BucketName()}/objects?prefix=${encodeURIComponent(prefix)}`;
  const res = await fetch(url, {
    headers: cfHeaders(),
  });
  if (!res.ok) throw new Error(`R2 list failed for prefix "${prefix}": ${res.status}`);
  const body = await res.json() as { result: { objects: { key: string }[] } };
  return (body.result?.objects ?? []).map((o) => o.key);
}
