/**
 * Google Ads API REST Client
 *
 * Uses Google Ads API REST endpoints for fetching keyword historical metrics.
 * Note: Google Ads API primarily uses gRPC, but some endpoints support REST.
 *
 * For full KeywordPlanIdeaService functionality, we need to use a workaround:
 * 1. Use the Google Ads API REST format for KeywordPlanIdeaService
 * 2. Format: POST https://googleads.googleapis.com/v18/customers/{customerId}/keywordPlanIdeas:generate
 */

import type { MonthlySearchesEntry } from "../types/index.js";

export interface GoogleAdsRestClient {
  fetchHistoricalMetrics(keywords: string[]): Promise<GoogleAdsMetricRecord[]>;
}

export interface GoogleAdsMetricRecord {
  keywordText: string;
  avgMonthlySearches?: number | null;
  competition?: string | null;
  competitionIndex?: number | null;
  monthlySearches?: MonthlySearchesEntry[] | null;
}

export interface GoogleAdsRestClientOptions {
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
  accessToken: string;
  baseUrl?: string;
}

/**
 * Create a Google Ads REST client
 */
export function createGoogleAdsRestClient(
  options: GoogleAdsRestClientOptions
): GoogleAdsRestClient {
  return new GoogleAdsRestClientImpl(options);
}

class GoogleAdsRestClientImpl implements GoogleAdsRestClient {
  private developerToken: string;
  private customerId: string;
  private loginCustomerId?: string;
  private accessToken: string;
  private baseUrl: string;

  constructor(options: GoogleAdsRestClientOptions) {
    this.developerToken = options.developerToken;
    this.customerId = options.customerId;
    this.loginCustomerId = options.loginCustomerId;
    this.accessToken = options.accessToken;
    this.baseUrl = options.baseUrl || "https://googleads.googleapis.com/v18";
  }

  async fetchHistoricalMetrics(keywords: string[]): Promise<GoogleAdsMetricRecord[]> {
    if (keywords.length === 0) {
      return [];
    }

    // Google Ads API requires authentication and specific request format
    // The KeywordPlanIdeaService.generateKeywordIdeas endpoint is complex

    try {
      const response = await this.callKeywordPlanIdeaService(keywords);
      return this.parseKeywordPlanResponse(response);
    } catch (error) {
      console.error("Google Ads REST API call failed:", error);
      // Return failure records for all keywords
      return keywords.map((keyword) => ({
        keywordText: keyword,
        avgMonthlySearches: null,
        competition: null,
        competitionIndex: null,
        monthlySearches: null,
      }));
    }
  }

  private async callKeywordPlanIdeaService(keywords: string[]): Promise<any> {
    // Build the request body for KeywordPlanIdeaService
    const requestBody = {
      generateKeywordIdeas: {
        customerId: this.customerId,
        language: "languageConstants/1000", // English
        geoTargetConstants: ["geoTargetConstants/2840"], // USA
        includeAdGroupIdeas: false,
        keywordPlanNetwork: "GOOGLE_SEARCH",
        keywordSeed: {
          keywords: keywords,
        },
      },
    };

    // Build headers
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.accessToken}`,
      "developer-token": this.developerToken,
      "Content-Type": "application/json",
    };

    if (this.loginCustomerId) {
      headers["login-customer-id"] = this.loginCustomerId;
    }

    // Make the request
    const url = `${this.baseUrl}/customers/${this.customerId}/keywordPlanIdeaService:generateKeywordIdeas`;

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Ads API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  private parseKeywordPlanResponse(response: any): GoogleAdsMetricRecord[] {
    const records: GoogleAdsMetricRecord[] = [];

    if (response?.keywordIdeaMetrics) {
      for (const metric of response.keywordIdeaMetrics) {
        records.push({
          keywordText: metric.text || "",
          avgMonthlySearches: metric.avgMonthlySearches ?? null,
          competition: metric.competition ?? null,
          competitionIndex: metric.competitionIndex ?? null,
          monthlySearches: this.parseMonthlySearches(metric.monthlySearches),
        });
      }
    }

    return records;
  }

  private parseMonthlySearches(monthlySearches: any): MonthlySearchesEntry[] | null {
    if (!monthlySearches) {
      return null;
    }

    return monthlySearches.map((entry: any) => ({
      year: entry.year,
      month: entry.month,
      count: entry.count,
    }));
  }
}

/**
 * Get access token from refresh token
 */
export async function getAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}
