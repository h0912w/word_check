import type { Env } from './types.js';
import { getAccessToken, fetchHistoricalMetrics } from './googleAdsClient.js';
import { normalizeResponse } from './responseNormalizer.js';
import { canRunBatch } from './quotaGuard.js';
import {
  getPendingShards,
  getShardWords,
  updateShardStatus,
  saveBatchResults,
  recordBatchRun,
} from './storage.js';

const BATCH_SIZE = 20;
const MAX_BATCHES_PER_RUN = 5;
const MAX_RETRIES = 3;

export async function runBatch(env: Env): Promise<void> {
  const pendingShards = await getPendingShards(env, MAX_BATCHES_PER_RUN);

  if (pendingShards.length === 0) {
    console.log('[batchRunner] No pending shards.');
    return;
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(env);
  } catch (err) {
    console.error('[batchRunner] Failed to obtain access token:', err);
    return;
  }

  for (const shard of pendingShards) {
    if (!(await canRunBatch(env, BATCH_SIZE))) {
      console.log('[batchRunner] Daily quota approaching limit — stopping early.');
      break;
    }

    await updateShardStatus(env, shard.shard_id, 'running');
    console.log(`[batchRunner] Processing shard ${shard.shard_id} (retry=${shard.retry_count})`);

    const runId = `run_${Date.now()}_${shard.shard_id}`;

    try {
      const words = await getShardWords(env, shard.shard_id, shard.input_batch_id);
      const retryCountMap = new Map<string, number>();

      let rawResponse: unknown;
      try {
        rawResponse = await fetchHistoricalMetrics(words, env, accessToken);
      } catch (apiErr) {
        console.error(`[batchRunner] Google Ads API error for shard ${shard.shard_id}:`, apiErr);
        const nextRetry = (shard.retry_count ?? 0) + 1;
        await updateShardStatus(
          env,
          shard.shard_id,
          nextRetry >= MAX_RETRIES ? 'failed' : 'retry',
          nextRetry,
        );
        await recordBatchRun(env, runId, shard.shard_id, BATCH_SIZE, 0, 0, 'api_error');
        continue;
      }

      const records = normalizeResponse(
        rawResponse,
        words,
        shard.shard_id,
        0,
        shard.input_batch_id,
        retryCountMap,
      );

      await saveBatchResults(env, records, shard.shard_id);
      await updateShardStatus(env, shard.shard_id, 'done');
      await recordBatchRun(
        env,
        runId,
        shard.shard_id,
        BATCH_SIZE,
        0,
        records.length,
        'success',
      );

      console.log(`[batchRunner] Shard ${shard.shard_id} complete: ${records.length} records.`);
    } catch (err) {
      console.error(`[batchRunner] Unexpected error for shard ${shard.shard_id}:`, err);
      const nextRetry = (shard.retry_count ?? 0) + 1;
      await updateShardStatus(
        env,
        shard.shard_id,
        nextRetry >= MAX_RETRIES ? 'failed' : 'retry',
        nextRetry,
      );
    }
  }
}
