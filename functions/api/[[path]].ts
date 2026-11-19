// Cloudflare Pages entry point: [[path]] catches every /api/* request.
// Pages doesn't cache function responses on its own, so this adapter keeps a
// copy in the colo's cache for as long as the handler's s-maxage allows.

import type { Env } from "../../core/env.js";
import { handleApi } from "../../core/handler.js";

type PagesContext = {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
};

// Cloudflare's runtime adds `caches.default`; DOM typings don't know it.
declare const caches: CacheStorage & { default: Cache };

export async function onRequest({ request, env, waitUntil }: PagesContext) {
  if (request.method !== "GET") return handleApi(request, env);

  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await handleApi(request, env);
  const sMaxAge = /s-maxage=(\d+)/.exec(response.headers.get("cache-control") ?? "");
  if (response.ok && sMaxAge) {
    // The Cache API uses max-age, so store a copy with s-maxage moved there.
    const stored = new Response(response.clone().body, response);
    stored.headers.set("cache-control", `public, max-age=${sMaxAge[1]}`);
    waitUntil(cache.put(request, stored));
  }
  return response;
}
