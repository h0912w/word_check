import type { Env, MetricsRecord, ShardEntry } from './types.js';

// ─── Shard state ────────────────────────────────────────────────────────────

export async function getPendingShards(env: Env, limit: number): Promise<ShardEntry[]> {
  const result = await env.STATE_DB
    .prepare(
      `SELECT * FROM shards
       WHERE status IN ('pending', 'retry')
       ORDER BY retry_count ASC, created_at ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all<ShardEntry>();
  return result.results ?? [];
}

export async function updateShardStatus(
  env: Env,
  shardId: string,
  status: ShardEntry['status'],
  retryCount?: number,
): Promise<void> {
  const now = new Date().toISOString();
  if (retryCount !== undefined) {
    await env.STATE_DB
      .prepare(`UPDATE shards SET status = ?, retry_count = ?, updated_at = ? WHERE shard_id = ?`)
      .bind(status, retryCount, now, shardId)
      .run();
  } else {
    await env.STATE_DB
      .prepare(`UPDATE shards SET status = ?, updated_at = ? WHERE shard_id = ?`)
      .bind(status, now, shardId)
      .run();
  }
}

// ─── R2 shard access ─────────────────────────────────────────────────────────

export async function getShardWords(
  env: Env,
  shardId: string,
  inputBatchId: string,
): Promise<string[]> {
  const key = `inputs/${inputBatchId}/shards/${shardId}.txt`;
  const obj = await env.RESULTS_BUCKET.get(key);
  if (!obj) throw new Error(`Shard not found in R2: ${key}`);
  const text = await obj.text();
  return text
    .split('\n')
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

// ─── Results storage ─────────────────────────────────────────────────────────

export async function saveBatchResults(
  env: Env,
  records: MetricsRecord[],
  shardId: string,
): Promise<void> {
  const exportDate = new Date().toISOString().slice(0, 10);
  const key = `results/${exportDate}/records/${shardId}.ndjson`;
  const ndjson = records.map((r) => JSON.stringify(r)).join('\n');
  await env.RESULTS_BUCKET.put(key, ndjson, {
    httpMetadata: { contentType: 'application/x-ndjson' },
  });
}

// ─── Batch run log ────────────────────────────────────────────────────────────

export async function recordBatchRun(
  env: Env,
  runId: string,
  shardId: string,
  batchSize: number,
  offset: number,
  processedCount: number,
  apiStatus: string,
): Promise<void> {
  const now = new Date().toISOString();
  await env.STATE_DB
    .prepare(
      `INSERT INTO batch_runs
         (run_id, shard_id, batch_start_offset, batch_size, processed_count, api_status, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(runId, shardId, offset, batchSize, processedCount, apiStatus, now, now)
    .run();
}
