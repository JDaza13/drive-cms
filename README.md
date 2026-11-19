# drive-cms

A static site with one dynamic section: a feed that reads a Google Drive
folder. Write a Google Doc (or drop an image) in the folder and it shows up on
the page within minutes. No admin panel, no database.

- **Site:** Vite + React + TypeScript + Tailwind, in Spanish (default), English
  and Simplified Chinese.
- **Feed API:** one small Web-standard handler in `core/` that runs on
  **Vercel** today and on **Cloudflare Pages** without code changes.
- **Contact:** a form that opens WhatsApp with a pre-filled message.

## Placeholders to replace

| What | Where | Current value |
| --- | --- | --- |
| Business name | `src/config.ts` (`brand`), `src/i18n/*.ts` (`meta.title`), `index.html` | "Drive CMS" (placeholder) |
| Hero, feed and contact copy | `src/i18n/es.ts`, `en.ts`, `zh.ts` | Generic copy about the Drive feed |
| Contact topics | `src/config.ts` (`topicIds`) + `contact.topics` in each language | info / quote / other |
| WhatsApp | `src/config.ts` | +57 316 697 6348 (real, given by the owner) |
| Demo posts | `core/demo-feed.ts` | Sample content shown until Drive is connected |

## How it works

```
Browser ──GET /api/feed──▶ CDN cache (5 min) ──▶ core/handler.ts ──▶ Google Drive API
                                                   │
                                     service-account key (env var, server only)
```

- `GET /api/feed` lists the newest Google Docs and images (JPG, PNG, WebP, GIF)
  directly inside the folder. Docs are exported as Markdown and rendered on the
  page; raw HTML in a Doc is shown as text, never executed.
- `GET /api/file?id=…` streams one image from the folder, so the folder can stay
  **private**. It refuses files outside the folder and non-images.
- Responses carry `s-maxage` + `stale-while-revalidate`, so most visits are
  served from the CDN and Drive is called at most every few minutes.
- Each item uses the file name as its title and the Drive **Description** field
  (Details panel) as an optional subtitle.
- Until Drive is configured, the API serves sample posts (`source: "demo"`) and
  the page says so.

```
core/          host-independent API: handler, Drive calls, Google sign-in, types
api/index.ts   Vercel adapter (vercel.json rewrites /api/* to it)
functions/api/[[path]].ts   Cloudflare Pages adapter (adds edge caching)
scripts/vite-api-plugin.ts  local adapter for `pnpm dev` / `pnpm preview`
src/           the site
```

## Run locally

```bash
pnpm install
cp .env.example .env.local   # FEED_SOURCE=demo works without Google
pnpm dev                     # site + /api on http://localhost:5173
pnpm test                    # API tests against a fake Google
pnpm build && pnpm lint
```

## Connect Google Drive (one time)

1. In the [Google Cloud console](https://console.cloud.google.com/), create a
   project (any name).
2. **APIs & Services → Library →** enable **Google Drive API**.
3. **IAM & Admin → Service accounts → Create service account.** No roles needed.
   Open it, **Keys → Add key → JSON**, and keep the downloaded file safe. Never
   commit it: this repo is public.
4. In Drive, create the folder, **Share** it with the service account's email
   (`…@….iam.gserviceaccount.com`) as **Viewer**. The folder doesn't need to be
   public.
5. Copy the folder id from its URL: `drive.google.com/drive/folders/<id>`.
6. Set the environment variables (below) on the host and redeploy.

| Variable | Value |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The whole JSON key file, pasted as one value |
| `DRIVE_FOLDER_ID` | The folder id |
| `FEED_SOURCE` | Optional: `drive` or `demo`. Defaults to `drive` when both values above are set |
| `FEED_LIMIT` | Optional: items in the feed, 1–50 (default 20) |
| `FEED_CACHE_SECONDS` | Optional: CDN cache time (default 300) |

## Deploy on Vercel

1. [vercel.com/new](https://vercel.com/new) → import `JDaza13/drive-cms`.
   `vercel.json` sets the framework (Vite), pnpm and the `/api` rewrite.
2. **Settings → Environment Variables:** add the variables above (Production
   and Preview), then redeploy.

Every push to `main` deploys to production; every pull request gets a preview
URL. Note: Vercel's free Hobby plan is for non-commercial use; a business site
needs Pro.

## Moving to Cloudflare Pages

No code changes; `functions/api/[[path]].ts` is already there and caches
responses at the edge with the Cache API.

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
   → this repo. Build command `pnpm build`, output directory `dist`.
2. **Settings → Variables and Secrets:** add the same variables (as secrets).
3. Point the domain at Cloudflare and remove the Vercel project.

To try it locally: put the variables in `.dev.vars`, then
`pnpm build && pnpm dlx wrangler pages dev`.

## Limits worth knowing

- Only files directly in the folder are read (no subfolders), newest first by
  creation date.
- Images pasted inside a Doc are embedded in the Markdown as data URLs, which
  makes the feed heavier. For photos, upload them to the folder as files.
- Posts aren't translated: they appear in whatever language they were written.
  The page around them follows the visitor's language.
