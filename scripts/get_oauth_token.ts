#!/usr/bin/env tsx

/**
 * OAuth Token Generator Script
 *
 * This script helps you get a Google OAuth refresh token by:
 * 1. Opening a browser for OAuth authorization
 * 2. Running a local server to catch the callback
 * 3. Exchanging the auth code for tokens
 */

import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Load .env.local
const envPath = path.join(PROJECT_ROOT, ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim();
  }
}

const CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:8085/oauth2callback";

// Scopes we need
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/adwords",
];

function main() {
  console.log("🔑 Google OAuth Token Generator");
  console.log("=".repeat(60));

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("❌ GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET not found in .env.local");
    console.error("Please set these values first.");
    process.exit(1);
  }

  // Create auth URL
  const scope = SCOPES.join(" ");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent`;

  console.log("\n📋 Step 1: Open this URL in your browser:");
  console.log(`\n${authUrl}\n`);
  console.log("⏳ Waiting for authorization callback...");

  // Start local server to catch callback
  const server = http.createServer((req, res) => {
    if (req.url?.startsWith("/oauth2callback")) {
      const url = new URL(req.url, `http://localhost:8085`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html><body>
            <h1>❌ Authorization Failed</h1>
            <p>Error: ${error}</p>
            <p>You can close this window.</p>
          </body></html>
        `);
        server.close();
        process.exit(1);
        return;
      }

      if (code) {
        // Exchange code for tokens
        exchangeCodeForTokens(code, res);
      } else {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("Missing authorization code");
        server.close();
        process.exit(1);
      }
    }
  });

  server.listen(8085, () => {
    console.log(`   Local server listening on http://localhost:8085`);

    // Try to open browser automatically
    try {
      const platform = process.platform;
      if (platform === "darwin") {
        execSync(`open "${authUrl}"`);
      } else if (platform === "win32") {
        execSync(`start "" "${authUrl}"`);
      } else {
        execSync(`xdg-open "${authUrl}"`);
      }
      console.log("   ✓ Browser opened automatically");
    } catch (e) {
      console.log("   ⚠ Could not open browser automatically");
      console.log("   Please copy and paste the URL above into your browser.");
    }
  });
}

async function exchangeCodeForTokens(code: string, res: http.ServerResponse) {
  console.log("\n📋 Step 2: Exchanging authorization code for tokens...");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code,
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokens = await tokenResponse.json();

    // Send success response
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html><body>
        <h1>✅ Authorization Successful!</h1>
        <p>Your refresh token has been obtained and saved to .env.local</p>
        <p><strong>Refresh Token:</strong> ${tokens.refresh_token ? tokens.refresh_token.substring(0, 20) + "..." : "Not provided (try again with prompt=consent)"}</p>
        <p>You can close this window.</p>
      </body></html>
    `);

    // Update .env.local with refresh token
    if (tokens.refresh_token) {
      const newEnvContent = envContent.replace(
        /GOOGLE_REFRESH_TOKEN=.*/,
        `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
      );

      fs.writeFileSync(envPath, newEnvContent);
      console.log("\n✅ Refresh token saved to .env.local");

      // Verify
      console.log(`   Token: ${tokens.refresh_token.substring(0, 30)}...`);
    } else {
      console.log("\n⚠️  No refresh token received.");
      console.log("   This usually happens when you've already authorized before.");
      console.log("   Try revoking access and authorizing again.");
    }

    console.log("\n🎉 Done! You can now use Google APIs.");
    server.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error exchanging code for tokens:", error);
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`<html><body><h1>❌ Error</h1><p>${error}</p></body></html>`);
    server.close();
    process.exit(1);
  }
}

main();
