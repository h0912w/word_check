/**
 * Google Ads API Client (Local Execution)
 *
 * Uses Google Ads API REST interface with OAuth authentication.
 * No google-ads-node library dependency - direct REST API calls.
 */

import axios from 'axios';
import type { KeywordMetricRecord, GoogleAdsApiConfig } from '../types/index.js';

export interface LocalAdsClientOptions {
  config: GoogleAdsApiConfig;
  env: Record<string, string>;
}

export class LocalAdsClient {
  private config: GoogleAdsApiConfig;
  private env: Record<string, string>;
  private requestCount: number = 0;
  private maxRequestsPerDay: number;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly baseUrl = 'https://googleads.googleapis.com/v23';

  constructor(options: LocalAdsClientOptions) {
    this.config = options.config;
    this.env = options.env;

    // Parse budget from env if available
    const adsBudget = parseInt(this.env.FREE_TIER_ADS_BUDGET || '1000', 10);
    this.maxRequestsPerDay = adsBudget;
  }

  /**
   * Authenticate using OAuth refresh token
   */
  private async authenticate(): Promise<string> {
    // Check if current token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        refresh_token: this.env.GOOGLE_ADS_REFRESH_TOKEN,
        client_id: this.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: this.env.GOOGLE_ADS_CLIENT_SECRET,
        grant_type: 'refresh_token'
      });

      this.accessToken = response.data.access_token;
      // Token expires in 3600 seconds, refresh a bit earlier
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Google Ads authentication failed:', error);
      throw new Error(`Authentication failed: ${axios.isAxiosError(error) ? error.response?.data : error}`);
    }
  }

  /**
   * Check if we can start a batch based on quota limits
   * Quota is based on API calls, not keywords (each call processes batchSize keywords)
   */
  quotaGuard(batchSize: number): { ok: boolean; stopReason?: string } {
    const remaining = this.maxRequestsPerDay - this.requestCount;

    if (remaining <= 0) {
      return {
        ok: false,
        stopReason: 'ads_budget_exceeded',
      };
    }

    // Each API call counts as 1, regardless of batch size
    if (this.requestCount >= this.maxRequestsPerDay) {
      return {
        ok: false,
        stopReason: 'ads_budget_exceeded',
      };
    }

    return { ok: true };
  }

  /**
   * Fetch historical metrics for a list of keywords using Google Ads API
   */
  async fetchHistoricalMetrics(keywords: string[]): Promise<KeywordMetricRecord[]> {
    const guardResult = this.quotaGuard(keywords.length);
    if (!guardResult.ok) {
      throw new Error(`Quota exceeded: ${guardResult.stopReason}`);
    }

    try {
      const token = await this.authenticate();
      const customerId = this.config.customerId.replace(/-/g, '');

      // Use generateKeywordIdeas endpoint
      // Correct format: /customers/{customerId}:generateKeywordIdeas (per proto definition)
      const url = `${this.baseUrl}/customers/${customerId}:generateKeywordIdeas`;

      const requestBody = {
        keywordSeed: {
          keywords: keywords
        },
        keywordPlanNetwork: this.config.keywordPlanNetwork || 'GOOGLE_SEARCH',
        geoTargetConstants: [this.config.geoTargetConstants || 'geoTargetConstants/2840'],
        language: this.config.language || 'languageConstants/1000',
        includeAdultKeywords: false
      };

      // Build headers with optional login-customer-id
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'developer-token': this.env.GOOGLE_ADS_DEVELOPER_TOKEN
      };

      // Add login-customer-id header if accessing through Manager Account
      if (this.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
        headers['login-customer-id'] = this.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '');
      }

      const response = await axios.post(url, requestBody, { headers });

      // Count API calls, not keywords (each API call processes multiple keywords)
      this.requestCount += 1;
      return this.normalizeResponse(keywords, response.data);
    } catch (error) {
      // Log detailed error information
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('Google Ads API error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Google Ads API request failed:', error);
      }

      // Handle token expiry
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Force token refresh and retry once
        this.accessToken = null;
        this.tokenExpiry = 0;
        try {
          const token = await this.authenticate();
          const customerId = this.config.customerId.replace(/-/g, '');
          const url = `${this.baseUrl}/customers/${customerId}:generateKeywordIdeas`;

          const requestBody = {
            keywordSeed: {
              keywords: keywords
            },
            keywordPlanNetwork: this.config.keywordPlanNetwork || 'GOOGLE_SEARCH',
            geoTargetConstants: [this.config.geoTargetConstants || 'geoTargetConstants/2840'],
            language: this.config.language || 'languageConstants/1000',
            includeAdultKeywords: false
          };

          // Build headers with optional login-customer-id for retry
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'developer-token': this.env.GOOGLE_ADS_DEVELOPER_TOKEN
          };

          // Add login-customer-id header if accessing through Manager Account
          if (this.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
            headers['login-customer-id'] = this.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '');
          }

          const response = await axios.post(url, requestBody, { headers });

          // Count API calls, not keywords
          this.requestCount += 1;
          return this.normalizeResponse(keywords, response.data);
        } catch (retryError) {
          console.error('Retry after token refresh also failed:', retryError);
          return this.createFailureRecords(keywords, retryError);
        }
      }

      return this.createFailureRecords(keywords, error);
    }
  }

  /**
   * Normalize API response to KeywordMetricRecord format
   */
  private normalizeResponse(
    keywords: string[],
    response: any
  ): KeywordMetricRecord[] {
    const records: KeywordMetricRecord[] = [];

    // Create a map from keyword text to metrics
    const metricsMap = new Map<string, any>();

    // Handle Google Ads API v23 response format: { results: [...], totalSize: n }
    let resultsArray = response;
    if (response && response.results && Array.isArray(response.results)) {
      resultsArray = response.results;
    }

    if (resultsArray && Array.isArray(resultsArray)) {
      for (const item of resultsArray) {
        // The response structure from generateKeywordIdeas v23
        // item has: keywordIdeaMetrics, text, keywordAnnotations
        if (item.keywordIdeaMetrics) {
          const metrics = item.keywordIdeaMetrics;
          const keywordText = item.text || metrics.text || '';

          metricsMap.set(keywordText, {
            avgMonthlySearches: metrics.avgMonthlySearches ?? null,
            competition: metrics.competition ?? null,
            competitionIndex: metrics.competitionIndex ?? null,
            monthlySearches: metrics.monthlySearches ?? null,
          });
        }
        // Legacy support for older formats
        else if (item.keywordPlanIdeaMetrics) {
          const metrics = item.keywordPlanIdeaMetrics;
          const keywordText = metrics.text || item.text || '';

          metricsMap.set(keywordText, {
            avgMonthlySearches: metrics.avgMonthlySearches ?? null,
            competition: metrics.competition ?? null,
            competitionIndex: metrics.competitionIndex ?? null,
            monthlySearches: metrics.monthlySearches ?? null,
          });
        }
      }
    }

    // Create records for all input keywords
    for (const keyword of keywords) {
      const metrics = metricsMap.get(keyword) || metricsMap.get(keyword.toLowerCase());

      records.push({
        word: keyword,
        avg_monthly_searches: metrics?.avgMonthlySearches ?? null,
        competition: metrics?.competition ?? null,
        competition_index: metrics?.competitionIndex ?? null,
        monthly_searches_raw: metrics?.monthlySearches ?? null,
        collected_at: new Date().toISOString(),
        api_status: (metrics && metrics.avgMonthlySearches !== null) ? 'success' : 'failed',
        retry_count: 0,
        source_shard: '',
        source_offset: 0,
        input_batch_id: '',
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
      api_status: 'failed',
      retry_count: 0,
      source_shard: '',
      source_offset: 0,
      input_batch_id: '',
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
 * Create a local Google Ads client from environment
 */
export function createLocalAdsClient(env: Record<string, string>): LocalAdsClient {
  const config: GoogleAdsApiConfig = {
    developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
    customerId: env.GOOGLE_ADS_CUSTOMER_ID,
    loginCustomerId: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    geoTargetConstants: env.GOOGLE_ADS_GEO_TARGET_CONSTANTS || 'geoTargetConstants/2840',
    language: env.GOOGLE_ADS_LANGUAGE || 'languageConstants/1000',
    keywordPlanNetwork: env.GOOGLE_ADS_KEYWORD_PLAN_NETWORK || 'GOOGLE_SEARCH',
  };

  return new LocalAdsClient({ config, env });
}
