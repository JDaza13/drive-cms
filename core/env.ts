// Settings the API reads. Each host passes its own environment object
// (Vercel: process.env, Cloudflare: ctx.env, Vite dev: loadEnv), so nothing in
// core/ touches a host-specific global.

export type Env = {
  /** Full JSON key of the Google service account, as one string. */
  GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  /** The id at the end of the folder URL: drive.google.com/drive/folders/<id>. */
  DRIVE_FOLDER_ID?: string;
  /** "drive" or "demo". Defaults to "drive" when both values above are set. */
  FEED_SOURCE?: string;
  /** Maximum number of items in the feed (default 20, max 50). */
  FEED_LIMIT?: string;
  /** Seconds the CDN may serve a cached feed (default 300). */
  FEED_CACHE_SECONDS?: string;
};

export type FeedConfig =
  | { source: "demo"; limit: number; cacheSeconds: number }
  | {
      source: "drive";
      limit: number;
      cacheSeconds: number;
      folderId: string;
      serviceAccount: ServiceAccount;
    };

export type ServiceAccount = { client_email: string; private_key: string };

export class ConfigError extends Error {}

function intInRange(value: string | undefined, fallback: number, min: number, max: number) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

export function readConfig(env: Env): FeedConfig {
  const limit = intInRange(env.FEED_LIMIT, 20, 1, 50);
  const cacheSeconds = intInRange(env.FEED_CACHE_SECONDS, 300, 0, 86_400);
  const hasDrive = Boolean(env.GOOGLE_SERVICE_ACCOUNT_JSON && env.DRIVE_FOLDER_ID);
  const source = env.FEED_SOURCE?.trim() || (hasDrive ? "drive" : "demo");

  if (source === "demo") return { source, limit, cacheSeconds };
  if (source !== "drive") throw new ConfigError(`FEED_SOURCE must be "drive" or "demo"`);

  const folderId = env.DRIVE_FOLDER_ID?.trim() ?? "";
  // Folder ids are URL-safe base64; anything else would break the Drive query.
  if (!/^[\w-]{10,}$/.test(folderId)) throw new ConfigError("DRIVE_FOLDER_ID is missing or invalid");

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "");
  } catch {
    throw new ConfigError("GOOGLE_SERVICE_ACCOUNT_JSON is missing or not valid JSON");
  }
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    throw new ConfigError("GOOGLE_SERVICE_ACCOUNT_JSON needs client_email and private_key");
  }
  return { source, limit, cacheSeconds, folderId, serviceAccount };
}
