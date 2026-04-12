import type { Env } from './types.js';

const GOOGLE_ADS_API_VERSION = 'v17';

export async function getAccessToken(env: Env): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_ADS_CLIENT_ID,
      client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json() as { access_token: string };
  if (!data.access_token) {
    throw new Error('access_token missing from token response');
  }
  return data.access_token;
}

export async function fetchHistoricalMetrics(
  words: string[],
  env: Env,
  accessToken: string,
): Promise<unknown> {
  const customerId = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}:generateKeywordHistoricalMetrics`;

  const payload = {
    keywords: words,
    geoTargetConstants: [env.GOOGLE_ADS_GEO_TARGET_CONSTANT],
    language: env.GOOGLE_ADS_LANGUAGE_CONSTANT,
    keywordPlanNetwork: 'GOOGLE_SEARCH',
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
  };

  if (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers['login-customer-id'] = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Ads API error ${response.status}: ${errText}`);
  }

  return response.json();
}
