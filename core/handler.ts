// The whole API as one Web-standard handler: (Request, Env) => Response.
// Hosts only adapt their entry point to this signature:
//   api/index.ts                 Vercel
//   functions/api/[[path]].ts    Cloudflare Pages
//   scripts/vite-api-plugin.ts   local `pnpm dev`
//
// Routes
//   GET /api/feed          newest Docs and images in the folder, as JSON
//   GET /api/file?id=<id>  one image from the folder (private folders work)

import { demoItems } from "./demo-feed.js";
import { DriveError, downloadFile, getFile, isImageType, listFolder, toFeedItems } from "./drive.js";
import { ConfigError, readConfig, type Env, type FeedConfig } from "./env.js";
import { getAccessToken } from "./google-auth.js";
import type { ApiError, FeedResponse } from "./types.js";

/** Lets the CDN keep a copy for `seconds`, then refresh it in the background. */
export function cacheHeader(seconds: number) {
  if (seconds === 0) return "no-store";
  return `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 12}`;
}

const json = (body: FeedResponse | ApiError, status: number, cacheControl: string) =>
  Response.json(body, { status, headers: { "cache-control": cacheControl } });

const fail = (status: number, error: string) => json({ error }, status, "no-store");

async function feed(config: FeedConfig): Promise<Response> {
  const items =
    config.source === "demo"
      ? demoItems.slice(0, config.limit)
      : await (async () => {
          const token = await getAccessToken(config.serviceAccount);
          return toFeedItems(token, await listFolder(token, config.folderId, config.limit));
        })();
  const body: FeedResponse = {
    source: config.source,
    generatedAt: new Date().toISOString(),
    items,
  };
  return json(body, 200, cacheHeader(config.cacheSeconds));
}

async function file(config: FeedConfig, id: string | null): Promise<Response> {
  if (!id || !/^[\w-]{10,}$/.test(id)) return fail(400, "Missing or invalid id");
  if (config.source === "demo") return fail(404, "Not found");

  const token = await getAccessToken(config.serviceAccount);
  const meta = await getFile(token, id);
  // Only serve files that are part of the feed, even if the service account
  // can read other things.
  const inFolder = meta.parents?.includes(config.folderId) ?? false;
  if (!inFolder || !isImageType(meta.mimeType)) {
    return fail(404, "Not found");
  }
  const media = await downloadFile(token, id);
  return new Response(media.body, {
    headers: {
      "content-type": meta.mimeType,
      // Image ids don't change when the feed does, so cache longer.
      "cache-control": cacheHeader(Math.max(config.cacheSeconds, 86_400)),
      "x-content-type-options": "nosniff",
    },
  });
}

export async function handleApi(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const url = new URL(request.url);
  try {
    const config = readConfig(env);
    switch (url.pathname.replace(/\/+$/, "")) {
      case "/api/feed":
        return await feed(config);
      case "/api/file":
        return await file(config, url.searchParams.get("id"));
      default:
        return fail(404, "Not found");
    }
  } catch (error) {
    // Details go to the host's logs, never to visitors.
    console.error(error);
    if (error instanceof ConfigError) return fail(503, "Feed is not configured");
    if (error instanceof DriveError && error.status === 404) return fail(404, "Not found");
    return fail(502, "Could not reach Google Drive");
  }
}
