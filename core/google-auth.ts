// Service-account sign-in for Google APIs using only Web Crypto and fetch, so
// it runs unchanged on Node (Vercel), Workers (Cloudflare) and Vite dev.
// Flow: sign a JWT with the account's private key, trade it for an access token.
// https://developers.google.com/identity/protocols/oauth2/service-account#httprest

import type { ServiceAccount } from "./env.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const encodeJson = (value: unknown) =>
  base64url(new TextEncoder().encode(JSON.stringify(value)));

/** PEM "-----BEGIN PRIVATE KEY-----" (PKCS#8) to raw DER bytes. */
function pemToDer(pem: string): Uint8Array<ArrayBuffer> {
  const body = pem
    .replace(/\\n/g, "\n") // keys pasted into env vars often keep literal "\n"
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const der = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) der[i] = binary.charCodeAt(i);
  return der;
}

async function signJwt(account: ServiceAccount, scope: string, now: number) {
  const header = encodeJson({ alg: "RS256", typ: "JWT" });
  const claims = encodeJson({
    iss: account.client_email,
    scope,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  });
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const unsigned = `${header}.${claims}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64url(new Uint8Array(signature))}`;
}

// Tokens last an hour; warm function instances reuse them.
const cache = new Map<string, { token: string; expiresAt: number }>();

export async function getAccessToken(
  account: ServiceAccount,
  scope = DRIVE_READONLY_SCOPE,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = `${account.client_email} ${scope}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt - 60 > now) return cached.token;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: await signJwt(account, scope, now),
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token request failed: ${response.status} ${await response.text()}`);
  }
  const { access_token, expires_in } = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cache.set(cacheKey, { token: access_token, expiresAt: now + expires_in });
  return access_token;
}
