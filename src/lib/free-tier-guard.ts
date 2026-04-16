/**
 * Free Tier Guard
 *
 * Prevents exceeding free tier limits by checking budgets before
 * starting batch or publish operations.
 */

import type {
  BudgetState,
  QuotaGuardResult,
  StopReason,
  Env,
} from "../types/index.js";

export interface FreeTierGuardOptions {
  env: Env;
}

export class FreeTierGuard {
  private budgets: BudgetState;

  constructor(options: FreeTierGuardOptions) {
    const env = options.env;

    this.budgets = {
      worker: parseInt(env.FREE_TIER_WORKER_BUDGET || "10000", 10),
      ads: parseInt(env.FREE_TIER_ADS_BUDGET || "1000", 10),
      drive: parseInt(env.FREE_TIER_DRIVE_BUDGET || "100", 10),
      sheets: parseInt(env.FREE_TIER_SHEETS_BUDGET || "50", 10),
      driveStorageBlocked: false,
    };
  }

  /**
   * Check if we can start a batch operation
   */
  canStartBatch(batchSize: number): QuotaGuardResult {
    if (this.budgets.worker <= 0) {
      return {
        ok: false,
        stopReason: "worker_budget_exceeded",
      };
    }

    if (this.budgets.ads <= 0 || this.budgets.ads < batchSize) {
      return {
        ok: false,
        stopReason: "ads_budget_exceeded",
      };
    }

    if (this.budgets.driveStorageBlocked) {
      return {
        ok: false,
        stopReason: "drive_storage_threshold_reached",
      };
    }

    return { ok: true };
  }

  /**
   * Check if we can start a publish operation
   */
  canStartPublish(): QuotaGuardResult {
    if (this.budgets.worker <= 0) {
      return {
        ok: false,
        stopReason: "worker_budget_exceeded",
      };
    }

    if (this.budgets.drive <= 0) {
      return {
        ok: false,
        stopReason: "drive_budget_exceeded",
      };
    }

    if (this.budgets.sheets <= 0) {
      return {
        ok: false,
        stopReason: "sheets_budget_exceeded",
      };
    }

    if (this.budgets.driveStorageBlocked) {
      return {
        ok: false,
        stopReason: "drive_storage_threshold_reached",
      };
    }

    return { ok: true };
  }

  /**
   * Record worker execution
   */
  recordWorkerExecution(): void {
    this.budgets.worker--;
  }

  /**
   * Record ads API requests
   */
  recordAdsRequests(count: number): void {
    this.budgets.ads -= count;
  }

  /**
   * Record Drive upload
   */
  recordDriveUpload(): void {
    this.budgets.drive--;
  }

  /**
   * Record Sheets append
   */
  recordSheetsAppend(): void {
    this.budgets.sheets--;
  }

  /**
   * Block operations due to Drive storage
   */
  blockDriveStorage(): void {
    this.budgets.driveStorageBlocked = true;
  }

  /**
   * Get current budget state
   */
  getBudgetState(): BudgetState {
    return { ...this.budgets };
  }

  /**
   * Create a stop report
   */
  createStopReport(stopReason: StopReason, blockedPhase: string): string {
    const report = {
      date: new Date().toISOString().split("T")[0],
      stop_reason: stopReason,
      worker_budget_remaining: this.budgets.worker,
      ads_budget_remaining: this.budgets.ads,
      drive_budget_remaining: this.budgets.drive,
      sheets_budget_remaining: this.budgets.sheets,
      drive_storage_state: this.budgets.driveStorageBlocked
        ? "blocked"
        : "ok",
      blocked_phase: blockedPhase,
      created_at: new Date().toISOString(),
    };

    return JSON.stringify(report, null, 2);
  }
}

/**
 * Create a free tier guard from environment
 */
export function createFreeTierGuard(env: Env): FreeTierGuard {
  return new FreeTierGuard({ env });
}
