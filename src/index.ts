/**
 * Cloudflare Worker Entry Point
 *
 * This is the main entry point for the Cloudflare Worker that handles:
 * - scheduled event: Cron-triggered batch processing
 * - fetch event: HTTP endpoints for health checks and manual triggers
 */

import type { Env, ShardStatus, KeywordMetricRecord } from "./types/index.js";
import { createGoogleAdsClient } from "./ads-api/client.js";
import { createFreeTierGuard } from "./lib/free-tier-guard.js";
import { google } from "googleapis";

export interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

export interface EnvWithBindings extends Env {
  DB?: D1Database;
}

/**
 * Scheduled event handler for Cron triggers
 *
 * This is the main batch orchestration logic.
 */
export async function scheduled(
  event: ScheduledEvent,
  env: EnvWithBindings,
  ctx: ExecutionContext
): Promise<void> {
  console.log("Scheduled event triggered", {
    scheduledTime: new Date(event.scheduledTime).toISOString(),
    cron: event.cron,
  });

  const freeTierGuard = createFreeTierGuard(env);
  const adsClient = createGoogleAdsClient(env);

  // Check free tier guard before starting
  const guardResult = freeTierGuard.canStartBatch(10);
  if (!guardResult.ok) {
    console.warn("Free tier guard blocked batch execution", guardResult.stopReason);
    // Write stop report
    const report = freeTierGuard.createStopReport(
      guardResult.stopReason!,
      "batch-start"
    );
    console.log("Stop report:", report);
    return;
  }

  try {
    await runScheduledBatch(event, env, ctx, freeTierGuard, adsClient);
  } catch (error) {
    console.error("Scheduled batch execution failed:", error);
    throw error;
  }
}

/**
 * Run the scheduled batch processing loop
 */
async function runScheduledBatch(
  event: ScheduledEvent,
  env: EnvWithBindings,
  ctx: ExecutionContext,
  freeTierGuard: ReturnType<typeof createFreeTierGuard>,
  adsClient: ReturnType<typeof createGoogleAdsClient>
): Promise<void> {
  if (!env.DB) {
    throw new Error("D1 database binding not found");
  }

  const db = env.DB;

  // Find pending or retry shards
  const shardsResult = await db
    .prepare(
      "SELECT shard_id, file_path, total_rows, current_offset, retry_count, status FROM shards WHERE status IN ('pending', 'retry') ORDER BY shard_id LIMIT 10"
    )
    .all();

  if (!shardsResult.results || shardsResult.results.length === 0) {
    console.log("No pending or retry shards found");
    return;
  }

  console.log(`Found ${shardsResult.results.length} shards to process`);

  // Process each shard
  for (const shard of shardsResult.results as any[]) {
    const shardId = shard.shard_id;
    const currentOffset = shard.current_offset || 0;
    const totalRows = shard.total_rows;

    console.log(`Processing shard ${shardId} from offset ${currentOffset}`);

    // Update shard status to running
    await db
      .prepare("UPDATE shards SET status = 'running', last_run_at = ? WHERE shard_id = ?")
      .bind(new Date().toISOString(), shardId)
      .run();

    // Calculate batch size
    const batchSize = parseInt(env.BATCH_SIZE || "10", 10);
    const remainingRows = totalRows - currentOffset;
    const actualBatchSize = Math.min(batchSize, remainingRows);

    // Load keywords from shard
    const keywords = await loadKeywordsFromShard(
      shardId,
      currentOffset,
      actualBatchSize,
      env
    );

    if (keywords.length === 0) {
      console.log(`No keywords to process in shard ${shardId}`);
      // Mark as done if we've processed all rows
      if (currentOffset >= totalRows) {
        await db
          .prepare("UPDATE shards SET status = 'done', completed_at = ? WHERE shard_id = ?")
          .bind(new Date().toISOString(), shardId)
          .run();
      }
      continue;
    }

    try {
      // Fetch metrics from Google Ads
      const records = await adsClient.fetchHistoricalMetrics(keywords);

      console.log(`Fetched ${records.length} metrics records`);

      // Save results to D1
      const d1Result = await saveResultsToD1(
        db,
        shardId,
        shard.input_batch_id,
        currentOffset,
        records
      );

      if (d1Result.success) {
        console.log(`Saved ${d1Result.count} records to D1`);
      } else {
        console.error(`Failed to save to D1: ${d1Result.error}`);
      }

      // Save results to Drive (as backup)
      const driveResult = await saveResultsToDrive(
        shardId,
        currentOffset,
        records,
        env
      );

      if (driveResult.success) {
        console.log(`Saved results to Drive: ${driveResult.fileId}`);
      } else {
        console.warn(`Failed to save to Drive: ${driveResult.error}`);
      }

      // Update offset
      const newOffset = currentOffset + actualBatchSize;
      await db
        .prepare("UPDATE shards SET current_offset = ? WHERE shard_id = ?")
        .bind(newOffset, shardId)
        .run();

      // Mark as done if complete
      if (newOffset >= totalRows) {
        await db
          .prepare("UPDATE shards SET status = 'done', completed_at = ? WHERE shard_id = ?")
          .bind(new Date().toISOString(), shardId)
          .run();
        console.log(`Shard ${shardId} completed`);
      } else {
        console.log(`Shard ${shardId} progress: ${newOffset}/${totalRows}`);
      }

      // Record budget usage
      freeTierGuard.recordWorkerExecution();
      freeTierGuard.recordAdsRequests(actualBatchSize);
    } catch (error) {
      console.error(`Failed to process shard ${shardId}:`, error);

      // Update shard status to retry or failed
      const retryCount = shard.retry_count || 0;
      const maxRetryCount = parseInt(env.MAX_RETRY_COUNT || "3", 10);

      if (retryCount < maxRetryCount) {
        await db
          .prepare("UPDATE shards SET status = 'retry', retry_count = ? WHERE shard_id = ?")
          .bind(retryCount + 1, shardId)
          .run();
        console.log(`Shard ${shardId} marked for retry (${retryCount + 1}/${maxRetryCount})`);
      } else {
        await db
          .prepare("UPDATE shards SET status = 'failed' WHERE shard_id = ?")
          .bind(shardId)
          .run();
        console.log(`Shard ${shardId} marked as failed after ${maxRetryCount} retries`);
      }
    }

    // Check free tier guard before next batch
    const guardResult = freeTierGuard.canStartBatch(batchSize);
    if (!guardResult.ok) {
      console.warn("Free tier guard stopping batch execution", guardResult.stopReason);
      const report = freeTierGuard.createStopReport(
        guardResult.stopReason!,
        "batch-continue"
      );
      console.log("Stop report:", report);
      break;
    }
  }

  console.log("Batch processing cycle complete");
}

/**
 * Save keyword metrics results to D1 database
 *
 * Stores individual keyword results for tracking and export.
 */
async function saveResultsToD1(
  db: D1Database,
  shardId: string,
  inputBatchId: string,
  offset: number,
  records: KeywordMetricRecord[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let savedCount = 0;

    for (const record of records) {
      const rowKey = `${record.collected_at.split("T")[0]}|${inputBatchId}|${shardId}|${offset + savedCount}|${record.word}`;

      await db
        .prepare(
          `INSERT OR REPLACE INTO keyword_results (
            row_key, word, avg_monthly_searches, competition, competition_index,
            monthly_searches_raw, collected_at, api_status, source_shard,
            source_offset, input_batch_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          rowKey,
          record.word,
          record.avg_monthly_searches,
          record.competition,
          record.competition_index,
          JSON.stringify(record.monthly_searches_raw),
          record.collected_at,
          record.api_status,
          shardId,
          offset + savedCount,
          inputBatchId
        )
        .run();

      savedCount++;
    }

    return { success: true, count: savedCount };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Save results to Google Drive as JSON backup
 *
 * Creates a JSON file with all results from this batch run.
 */
async function saveResultsToDrive(
  shardId: string,
  offset: number,
  records: KeywordMetricRecord[],
  env: EnvWithBindings
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    const auth = new google.auth.OAuth2(
      env.GOOGLE_OAUTH_CLIENT_ID,
      env.GOOGLE_OAUTH_CLIENT_SECRET
    );
    auth.setCredentials({
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
    });

    const drive = google.drive({ version: "v3", auth });

    // Create JSON content
    const jsonContent = JSON.stringify(records, null, 2);

    // Create file metadata
    const fileName = `${shardId}_offset${offset}_${new Date().toISOString().split("T")[0]}.json`;
    const fileMetadata = {
      name: fileName,
      parents: env.GOOGLE_DRIVE_EXPORT_FOLDER_ID
        ? [env.GOOGLE_DRIVE_EXPORT_FOLDER_ID]
        : undefined,
    };

    // Create file
    const media = {
      mimeType: "application/json",
      body: jsonContent,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media as any,
    });

    return {
      success: true,
      fileId: response.data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Load keywords from a shard file
 *
 * Reads shard content from Google Drive or local file system
 * and returns the keywords starting from the specified offset.
 */
async function loadKeywordsFromShard(
  shardId: string,
  offset: number,
  batchSize: number,
  env: EnvWithBindings
): Promise<string[]> {
  // Try to read from Google Drive first (in production)
  // Fall back to local file system (for development)

  let shardContent: string | null = null;

  // Try Google Drive
  if (env.GOOGLE_DRIVE_INPUT_FOLDER_ID) {
    try {
      // Get access token via OAuth2 REST API
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: env.GOOGLE_REFRESH_TOKEN,
          client_id: env.GOOGLE_OAUTH_CLIENT_ID,
          client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token fetch failed: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json() as { access_token?: string };
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error("No access token in response");
      }

      console.log(`Got access token for Drive, loading shard ${shardId}...`);

      // Search for the shard file in Drive using REST API
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${shardId}.txt'+and+trashed=false&fields=files(id,name)`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        throw new Error(`Drive list failed: ${listResponse.status} - ${errorText}`);
      }

      const listData = await listResponse.json() as { files?: Array<{ id?: string }> };
      console.log(`Drive search result:`, JSON.stringify(listData));
      const files = listData.files;

      if (files && files.length > 0 && files[0].id) {
        const fileId = files[0].id;
        console.log(`Found file ${shardId}.txt with ID: ${fileId}`);

        // Download file content using REST API
        const downloadResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          }
        );

        if (!downloadResponse.ok) {
          const errorText = await downloadResponse.text();
          throw new Error(`Drive download failed: ${downloadResponse.status} - ${errorText}`);
        }

        shardContent = await downloadResponse.text();
        console.log(`Downloaded ${shardContent.length} bytes from Drive`);
      } else {
        console.log(`No file found for ${shardId}.txt in Drive`);
      }
    } catch (error) {
      console.warn(`Failed to load shard ${shardId} from Drive:`, error instanceof Error ? error.message : String(error));
      console.warn(`Error details:`, error);
    }
  }

  // Fall back to local file system (for development)
  if (!shardContent) {
    try {
      // In development, shards are in output/shards/
      // Note: This won't work in deployed Worker, only in local dev
      const fs = await import("fs");
      const path = await import("path");

      const shardPath = path.resolve(`output/shards/${shardId}.txt`);
      if (fs.existsSync(shardPath)) {
        shardContent = fs.readFileSync(shardPath, "utf-8");
      }
    } catch (error) {
      console.warn(`Failed to load shard ${shardId} from local file system:`, error);
    }
  }

  if (!shardContent) {
    console.error(`Could not load shard content for ${shardId}`);
    return [];
  }

  // Split by lines and filter empty lines
  const allKeywords = shardContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Return keywords from offset to offset + batchSize
  return allKeywords.slice(offset, offset + batchSize);
}

/**
 * Fetch event handler for HTTP requests
 *
 * Provides health check and manual trigger endpoints.
 */
export default {
  async scheduled(event: ScheduledEvent, env: EnvWithBindings, ctx: ExecutionContext) {
    await scheduled(event, env, ctx);
  },

  async fetch(request: Request, env: EnvWithBindings, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check endpoint
    if (path === "/health" || path === "/") {
      return Response.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "word-check-worker",
      });
    }

    // Status endpoint
    if (path === "/status") {
      if (!env.DB) {
        return Response.json({ error: "Database not available" }, { status: 503 });
      }

      try {
        // Get shard status summary
        const shardStatusResult = await env.DB
          .prepare(
            "SELECT status, COUNT(*) as count FROM shards GROUP BY status"
          )
          .all();

        const shardStatus: Record<string, number> = {};
        for (const row of (shardStatusResult.results || []) as any[]) {
          shardStatus[row.status] = row.count;
        }

        return Response.json({
          timestamp: new Date().toISOString(),
          shards: shardStatus,
          budget: {
            worker: env.FREE_TIER_WORKER_BUDGET || "10000",
            ads: env.FREE_TIER_ADS_BUDGET || "1000",
            drive: env.FREE_TIER_DRIVE_BUDGET || "100",
            sheets: env.FREE_TIER_SHEETS_BUDGET || "50",
          },
        });
      } catch (error) {
        return Response.json(
          { error: "Failed to get status", details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    // 404 for unknown paths
    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
