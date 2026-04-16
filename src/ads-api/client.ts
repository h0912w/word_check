/**
 * Google Ads API Client (Proxy Server Version)
 *
 * Handles communication with the Google Ads API proxy server.
 * The proxy server wraps the Google Ads KeywordPlanIdeaService.
 *
 * Security:
 * - Worker handles OAuth2 token management
 * - Proxy server validates API secret
 * - Only configured Worker origins can call proxy
 */

import type {
  Env,
  KeywordMetricRecord,
  GoogleAdsApiConfig,
  GoogleAdsHistoricalMetricsResponse,
  QuotaGuardResult,
} from "../types/index.js";

export interface GoogleAdsClientOptions {
  config: GoogleAdsApiConfig;
  env: Env;
}

export class GoogleAdsClient {
  private config: GoogleAdsApiConfig;
  private env: Env;
  private requestCount: number = 0;
  private maxRequestsPerDay: number = 1000; // Conservative default
  private proxyUrl: string;
  private apiSecret: string;

  constructor(options: GoogleAdsClientOptions) {
    this.config = options.config;
    this.env = options.env;

    // Parse budget from env if available
    const adsBudget = parseInt(this.env.FREE_TIER_ADS_BUDGET || "1000", 10);
    this.maxRequestsPerDay = adsBudget;

    // Proxy server configuration
    this.proxyUrl = this.env.PROXY_SERVER_URL || "http://localhost:3001";
    this.apiSecret = this.env.PROXY_API_SECRET || "";
  }

  /**
   * Check if we can start a batch based on quota limits
   */
  quotaGuard(batchSize: number): QuotaGuardResult {
    const remaining = this.maxRequestsPerDay - this.requestCount;

    if (remaining <= 0) {
      return {
        ok: false,
        stopReason: "ads_budget_exceeded",
      };
    }

    if (batchSize > remaining) {
      return {
        ok: false,
        stopReason: "ads_budget_exceeded",
      };
    }

    return { ok: true };
  }

  /**
   * Fetch historical metrics for a list of keywords
   */
  async fetchHistoricalMetrics(
    keywords: string[]
  ): Promise<KeywordMetricRecord[]> {
    const guardResult = this.quotaGuard(keywords.length);
    if (!guardResult.ok) {
      throw new Error(`Quota exceeded: ${guardResult.stopReason}`);
    }

    try {
      const response = await this.makeApiRequest(keywords);
      this.requestCount += keywords.length;

      return this.normalizeResponse(keywords, response);
    } catch (error) {
      console.error("Google Ads API request failed:", error);
      return this.createFailureRecords(keywords, error);
    }
  }

  /**
   * Make the actual API request via proxy server
   *
   * Note: Proxy server uses its own Google Ads credentials (refresh token)
   * Worker only validates via API secret, no OAuth2 token needed
   */
  private async makeApiRequest(keywords: string[]): Promise<any> {
    // Call proxy server (proxy handles OAuth2 internally)
    const response = await fetch(`${this.proxyUrl}/api/metrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Secret": this.apiSecret,
      },
      body: JSON.stringify({
        keywords: keywords,
        customerId: this.config.customerId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Proxy server failed: ${data.error || "Unknown error"}`);
    }

    // Transform to expected response format
    return {
      results: (data.metrics || []).map((m: any) => ({
        keywordText: m.keywordText,
        keywordMetrics: {
          avgMonthlySearches: m.avgMonthlySearches,
          competition: m.competition,
          competitionIndex: m.competitionIndex,
          monthlySearches: m.monthlySearches,
        },
      })),
    };
  }

  /**
   * Normalize API response to KeywordMetricRecord format
   */
  private normalizeResponse(
    keywords: string[],
    response: any
  ): KeywordMetricRecord[] {
    const records: KeywordMetricRecord[] = [];

    // Map response to input keywords
    const resultMap = new Map<string, GoogleAdsHistoricalMetricsResponse>();

    if (response?.results) {
      for (const result of response.results) {
        const keyword = result.keywordText || result.text;
        const metrics = result.keywordMetrics || result;

        resultMap.set(keyword, {
          averageMonthlySearches: metrics.avgMonthlySearches || null,
          competition: metrics.competition || null,
          competitionIndex: metrics.competitionIndex || null,
          monthlySearches: metrics.monthlySearches || null,
        });
      }
    }

    // Create records for all input keywords
    for (const keyword of keywords) {
      const metrics = resultMap.get(keyword);

      records.push({
        word: keyword,
        avg_monthly_searches: metrics?.averageMonthlySearches ?? null,
        competition: metrics?.competition ?? null,
        competition_index: metrics?.competitionIndex ?? null,
        monthly_searches_raw: metrics?.monthlySearches ?? null,
        collected_at: new Date().toISOString(),
        api_status: metrics ? "success" : "failed",
        retry_count: 0,
        source_shard: "",
        source_offset: 0,
        input_batch_id: "",
      });
    }

    return records;
  }

  /**
   * Create failure records for keywords that failed to fetch
   */
  private createFailureRecords(
    keywords: string[],
    error: unknown
  ): KeywordMetricRecord[] {
    return keywords.map((keyword) => ({
      word: keyword,
      avg_monthly_searches: null,
      competition: null,
      competition_index: null,
      monthly_searches_raw: null,
      collected_at: new Date().toISOString(),
      api_status: "failed",
      retry_count: 0,
      source_shard: "",
      source_offset: 0,
      input_batch_id: "",
    }));
  }

  /**
   * Get remaining request budget
   */
  getRemainingBudget(): number {
    return this.maxRequestsPerDay - this.requestCount;
  }

  /**
   * Reset request counter (for testing or daily reset)
   */
  resetRequestCounter(): void {
    this.requestCount = 0;
  }
}

/**
 * Create a Google Ads client from environment
 */
export function createGoogleAdsClient(env: Env): GoogleAdsClient {
  const config: GoogleAdsApiConfig = {
    developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
    customerId: env.GOOGLE_ADS_CUSTOMER_ID,
    loginCustomerId: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    geoTargetConstants:
      env.GOOGLE_ADS_GEO_TARGET_CONSTANTS || "geoTargetConstants/2840",
    language: env.GOOGLE_ADS_LANGUAGE || "languageConstants/1000",
    keywordPlanNetwork:
      env.GOOGLE_ADS_KEYWORD_PLAN_NETWORK || "GOOGLE_SEARCH",
  };

  return new GoogleAdsClient({ config, env });
}
