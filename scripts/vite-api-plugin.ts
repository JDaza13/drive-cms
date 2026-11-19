// Third host adapter: serves /api/* from core/handler.ts during `pnpm dev` and
// `pnpm preview`, with settings from .env.local. No Vercel or Cloudflare
// account needed to work on the site.

import type { IncomingMessage, ServerResponse } from "node:http";
import { loadEnv, type Connect, type Plugin, type PreviewServer, type ViteDevServer } from "vite";
import type { Env } from "../core/env.ts";

type Handler = (request: Request, env: Env) => Promise<Response>;

function middleware(env: Env, load: () => Promise<Handler>): Connect.NextHandleFunction {
  return (req: IncomingMessage, res: ServerResponse, next) => {
    if (!req.url?.startsWith("/api/")) return next();
    (async () => {
      const request = new Request(new URL(req.url!, `http://${req.headers.host}`), {
        method: req.method,
      });
      const response = await (await load())(request, env);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(Buffer.from(await response.arrayBuffer()));
    })().catch(next);
  };
}

export function apiPlugin(): Plugin {
  let env: Env = {};
  return {
    name: "drive-cms-api",
    configResolved(config) {
      // "" prefix: read every variable, not just VITE_*. Never exposed to the
      // browser bundle, only passed to the handler.
      env = { ...loadEnv(config.mode, config.root, ""), ...process.env } as Env;
    },
    configureServer(server: ViteDevServer) {
      // ssrLoadModule picks up edits to core/ without restarting.
      const load = async () =>
        ((await server.ssrLoadModule("/core/handler.ts")) as { handleApi: Handler }).handleApi;
      server.middlewares.use(middleware(env, load));
    },
    async configurePreviewServer(server: PreviewServer) {
      const { handleApi } = await import("../core/handler.ts");
      server.middlewares.use(middleware(env, async () => handleApi));
    },
  };
}
