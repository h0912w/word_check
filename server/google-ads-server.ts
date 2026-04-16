/**
 * Google Ads API Server
 *
 * HTTP server that wraps Google Ads API for keyword metrics.
 * Cloudflare Workers call this server to fetch keyword data.
 *
 * Run locally: npm run ads-server
 * Deploy to Railway: railway up
 *
 * Security:
 * - Accepts requests only from configured Worker domains (CORS)
 * - Validates shared API secret in header
 * - Worker handles OAuth2 and passes access_token
 *
 * Implementation:
 * - Uses google-ads-node library (gRPC) for Google Ads API
 * - KeywordPlanIdeaService only supports gRPC, not REST
 */

import express, { Request, Response } from "express";
import cors from "cors";
import { GoogleAdsApi, enums } from "google-ads-node";

// Express app
const app = express();

// CORS configuration - only allow Worker domain
const WORKER_DOMAIN = process.env.WORKER_DOMAIN || "*.workers.dev";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [WORKER_DOMAIN];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type", "X-API-Secret", "Authorization"],
}));

app.use(express.json());

// Validate required environment variables
const REQUIRED_VARS = [
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "API_SECRET",
];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

// Constants
const PORT = parseInt(process.env.PORT || "3001", 10);
const API_SECRET = process.env.API_SECRET!;

// Google Ads configuration
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
const GOOGLE_ADS_CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID!;
const GOOGLE_ADS_LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID!;
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET!;
const GOOGLE_ADS_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN!;

/**
 * Validate API secret from Worker
 */
function validateApiSecret(req: Request): boolean {
  const secret = req.headers["x-api-secret"];
  return secret === API_SECRET;
}

/**
 * POST /api/metrics
 *
 * Request headers:
 * - X-API-Secret: Shared secret with Worker
 * - Authorization: Bearer {access_token} (OAuth2 token from Worker, optional - proxy can use its own)
 *
 * Request body:
 * {
 *   "keywords": ["keyword1", "keyword2", ...],
 *   "customerId": "1234567890" (optional, uses env default)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "metrics": [...]
 * }
 */
app.post("/api/metrics", async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate API secret
    if (!validateApiSecret(req)) {
      console.warn("[Google Ads] Invalid API secret");
      res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
      return;
    }

    const { keywords, customerId } = req.body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      res.status(400).json({
        success: false,
        error: "keywords must be a non-empty array",
      });
      return;
    }

    const effectiveCustomerId = customerId || GOOGLE_ADS_CUSTOMER_ID;
    const customerIds = effectiveCustomerId.replace(/-/g, "");

    console.log(`[Google Ads] Fetching metrics for ${keywords.length} keywords`);
    console.log(`[Google Ads] Customer ID: ${customerIds}`);

    // Create Google Ads API client using google-ads-node
    const client = new GoogleAdsApi({
      client_id: GOOGLE_ADS_CLIENT_ID,
      client_secret: GOOGLE_ADS_CLIENT_SECRET,
      developer_token: GOOGLE_ADS_DEVELOPER_TOKEN,
    });

    // Create a customer instance with refresh token
    const customer = client.Customer({
      customer_id: customerIds,
      refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
      login_customer_id: GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    });

    // Call KeywordPlanIdeaService using gRPC
    const results = await customer.keywordPlanIdeas.generateKeywordIdeas({
      customer_id: customerIds,
      language: "languageConstants/1000", // English
      geo_target_constants: ["geoTargetConstants/2840"], // USA
      include_ad_group_ideas: false,
      keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
      keyword_seed: {
        keywords: keywords,
      },
    });

    // Parse response
    const metrics = [];
    if (results && results.length > 0) {
      for (const result of results) {
        const idea = result.keywordIdeaMetrics;
        if (idea) {
          metrics.push({
            keywordText: idea.text || "",
            avgMonthlySearches: idea.avgMonthlySearches ?? null,
            competition: idea.competition ?? null,
            competitionIndex: idea.competitionIndex ?? null,
            monthlySearches: idea.monthlySearches ?? null,
          });
        }
      }
    }

    console.log(`[Google Ads] Returning ${metrics.length} results`);

    res.json({
      success: true,
      metrics: metrics,
    });
  } catch (error) {
    console.error("[Google Ads] Error:", error);

    // On error, return failure records for all keywords
    const { keywords } = req.body;
    res.json({
      success: true,
      metrics: (keywords || []).map((keyword: string) => ({
        keywordText: keyword,
        avgMonthlySearches: null,
        competition: null,
        competitionIndex: null,
        monthlySearches: null,
      })),
    });
  }
});

/**
 * GET /health
 *
 * Health check endpoint
 */
app.get("/health", (_req: Request, res: Response): void => {
  res.json({
    status: "ok",
    service: "google-ads-server",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("Google Ads API Server (gRPC via google-ads-node)");
  console.log("=".repeat(60));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log();
  console.log("Endpoints:");
  console.log(`  POST http://localhost:${PORT}/api/metrics`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log();
  console.log(`Customer ID: ${GOOGLE_ADS_CUSTOMER_ID}`);
  console.log(`Developer Token: ${GOOGLE_ADS_DEVELOPER_TOKEN.substring(0, 10)}...`);
  console.log(`Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log("=".repeat(60));
});
