/**
 * Mock Google Ads API Client (For Testing)
 *
 * This client returns mock data for testing without actual API calls.
 * Used for QA testing when real API credentials are not available.
 */

import type { KeywordMetricRecord, GoogleAdsApiConfig } from '../types/index.js';

export interface MockAdsClientOptions {
  config: GoogleAdsApiConfig;
  env: Record<string, string>;
}

export class MockAdsClient {
  private config: GoogleAdsApiConfig;
  private env: Record<string, string>;
  private requestCount: number = 0;
  private maxRequestsPerDay: number;

  // Mock data for testing
  private mockMetrics = {
    avg_monthly_searches: [1000, 5000, 10000, 50000, 100000],
    competition: ['LOW', 'MEDIUM', 'HIGH'],
    competition_index: [10, 50, 90],
  };

  constructor(options: MockAdsClientOptions) {
    this.config = options.config;
    this.env = options.env;

    const adsBudget = parseInt(this.env.FREE_TIER_ADS_BUDGET || '1000', 10);
    this.maxRequestsPerDay = adsBudget;
  }

  quotaGuard(batchSize: number): { ok: boolean; stopReason?: string } {
    const remaining = this.maxRequestsPerDay - this.requestCount;

    if (remaining <= 0) {
      return {
        ok: false,
        stopReason: 'ads_budget_exceeded',
      };
    }

    if (batchSize > remaining) {
      return {
        ok: false,
        stopReason: 'ads_budget_exceeded',
      };
    }

    return { ok: true };
  }

  async fetchHistoricalMetrics(keywords: string[]): Promise<KeywordMetricRecord[]> {
    const guardResult = this.quotaGuard(keywords.length);
    if (!guardResult.ok) {
      throw new Error(`Quota exceeded: ${guardResult.stopReason}`);
    }

    this.requestCount += keywords.length;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return keywords.map((keyword) => {
      const avgMonthlySearches = this.getRandomElement(this.mockMetrics.avg_monthly_searches);
      const competition = this.getRandomElement(this.mockMetrics.competition);
      const competitionIndex = this.getRandomElement(this.mockMetrics.competition_index);

      return {
        word: keyword,
        avg_monthly_searches: avgMonthlySearches,
        competition: competition,
        competition_index: competitionIndex,
        monthly_searches_raw: this.generateMonthlySearches(avgMonthlySearches),
        collected_at: new Date().toISOString(),
        api_status: 'success',
        retry_count: 0,
        source_shard: '',
        source_offset: 0,
        input_batch_id: '',
      };
    });
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private generateMonthlySearches(avg: number): Record<string, number> {
    // Generate 12 months of mock data with slight variations
    const monthlySearches: Record<string, number> = {};
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];

    for (const month of months) {
      const variation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
      monthlySearches[month] = Math.round(avg * variation);
    }

    return monthlySearches;
  }

  getRemainingBudget(): number {
    return this.maxRequestsPerDay - this.requestCount;
  }

  resetRequestCounter(): void {
    this.requestCount = 0;
  }
}

export function createMockAdsClient(env: Record<string, string>): MockAdsClient {
  const config: GoogleAdsApiConfig = {
    developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN || 'mock-dev-token',
    customerId: env.GOOGLE_ADS_CUSTOMER_ID || '1234567890',
    loginCustomerId: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    geoTargetConstants: env.GOOGLE_ADS_GEO_TARGET_CONSTANTS || 'geoTargetConstants/2840',
    language: env.GOOGLE_ADS_LANGUAGE || 'languageConstants/1000',
    keywordPlanNetwork: env.GOOGLE_ADS_KEYWORD_PLAN_NETWORK || 'GOOGLE_SEARCH',
  };

  return new MockAdsClient({ config, env });
}
