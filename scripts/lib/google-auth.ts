import { requireEnv } from './env.js';
import { google } from 'googleapis';

/**
 * Returns an authenticated Google OAuth2 client.
 * Uses service account if GOOGLE_SERVICE_ACCOUNT_EMAIL and
 * GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are set, otherwise falls back to
 * OAuth2 refresh token credentials.
 */
export function getGoogleAuthClient(scopes: string[]) {
  const serviceAccountEmail = process.env['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
  const serviceAccountKey = process.env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'];

  if (serviceAccountEmail && serviceAccountKey) {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: serviceAccountKey.replace(/\\n/g, '\n'),
      },
      scopes,
    });
  }

  // OAuth2 refresh token flow
  const oauth2 = new google.auth.OAuth2(
    requireEnv('GOOGLE_ADS_CLIENT_ID'),
    requireEnv('GOOGLE_ADS_CLIENT_SECRET'),
  );
  oauth2.setCredentials({ refresh_token: requireEnv('GOOGLE_ADS_REFRESH_TOKEN') });
  return oauth2;
}

/** Returns an access token string using the OAuth2 refresh token. */
export async function getAccessToken(): Promise<string> {
  const oauth2 = new google.auth.OAuth2(
    requireEnv('GOOGLE_ADS_CLIENT_ID'),
    requireEnv('GOOGLE_ADS_CLIENT_SECRET'),
  );
  oauth2.setCredentials({ refresh_token: requireEnv('GOOGLE_ADS_REFRESH_TOKEN') });
  const { token } = await oauth2.getAccessToken();
  if (!token) throw new Error('Failed to obtain Google access token');
  return token;
}
