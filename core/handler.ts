// The whole API as one Web-standard handler: (Request, Env) => Response.
// Hosts only adapt their entry point to this signature:
//   api/index.ts                 Vercel
//   functions/api/[[path]].ts    Cloudflare Pages
//   scripts/vite-api-plugin.ts   local `pnpm dev`
//
// Routes
//   GET /api/feed          newest Docs and images in the folder, as JSON
//   GET /api/file?id=<id>  one image from the folder (private folders work)
//   GET /api/doc-image?doc=<id>&n=<index>
//                          one picture embedded in a Doc (see doc-images.ts)

import { demoItems } from "./demo-feed.js";
import { decodeBase64, findInlineImages } from "./doc-images.js";
import {
  DriveError,
  downloadFile,
  exportMarkdown,
  getFile,
  isDoc,
  isImageType,
  listFolder,
  toFeedItems,
} from "./drive.js";
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

const isFileId = (id: string | null): id is string => Boolean(id && /^[\w-]{10,}$/.test(id));

/** Image responses: URLs change when content does, so the CDN can keep them longer. */
const imageHeaders = (config: FeedConfig, mimeType: string) => ({
  "content-type": mimeType,
  "cache-control": cacheHeader(Math.max(config.cacheSeconds, 86_400)),
  "x-content-type-options": "nosniff",
});

type DriveConfig = Extract<FeedConfig, { source: "drive" }>;

/**
 * Metadata for `id`, or null unless it sits directly in the feed folder and
 * passes `accept`. Keeps the API from serving anything else the service
 * account might be able to read.
 */
async function folderFile(
  config: DriveConfig,
  token: string,
  id: string,
  accept: (mimeType: string) => boolean,
) {
  const meta = await getFile(token, id);
  const inFolder = meta.parents?.includes(config.folderId) ?? false;
  return inFolder && accept(meta.mimeType) ? meta : null;
}

async function file(config: FeedConfig, id: string | null): Promise<Response> {
  if (!isFileId(id)) return fail(400, "Missing or invalid id");
  if (config.source === "demo") return fail(404, "Not found");

  const token = await getAccessToken(config.serviceAccount);
  const meta = await folderFile(config, token, id, isImageType);
  if (!meta) return fail(404, "Not found");
  const media = await downloadFile(token, id);
  return new Response(media.body, { headers: imageHeaders(config, meta.mimeType) });
}

async function docImage(config: FeedConfig, params: URLSearchParams): Promise<Response> {
  const docId = params.get("doc");
  const position = params.get("n") ?? "";
  if (!isFileId(docId) || !/^\d{1,3}$/.test(position)) {
    return fail(400, "Missing or invalid doc or n");
  }
  const n = Number(position);
  if (config.source === "demo") return fail(404, "Not found");

  const token = await getAccessToken(config.serviceAccount);
  if (!(await folderFile(config, token, docId, isDoc))) return fail(404, "Not found");
  const image = findInlineImages(await exportMarkdown(token, docId))[n];
  if (!image) return fail(404, "Not found");
  return new Response(decodeBase64(image.base64), {
    headers: imageHeaders(config, image.mimeType),
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
      case "/api/doc-image":
        return await docImage(config, url.searchParams);
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
