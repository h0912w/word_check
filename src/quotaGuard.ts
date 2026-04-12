import type { Env } from './types.js';

// Conservative daily limit; adjust based on actual account quota
const DAILY_QUOTA_LIMIT = 10_000;

export async function canRunBatch(env: Env, batchSize: number): Promise<boolean> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row = await env.STATE_DB
      .prepare(`SELECT COALESCE(SUM(processed_count), 0) AS total FROM batch_runs WHERE date(started_at) = ?`)
      .bind(today)
      .first<{ total: number }>();
    const usedToday = row?.total ?? 0;
    return usedToday + batchSize <= DAILY_QUOTA_LIMIT;
  } catch {
    // Fail open: if state DB is unavailable, allow the batch and log
    console.warn('[quotaGuard] Could not read quota from D1, allowing batch.');
    return true;
  }
}
