// Vercel entry point. vercel.json rewrites /api/* here; core/handler.ts does
// the routing. Vercel's CDN honours the s-maxage header the handler sets.

import { handleApi } from "../core/handler.js";

export default {
  fetch(request: Request) {
    return handleApi(request, process.env);
  },
};
