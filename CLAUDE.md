# drive-cms

Static site (Vite + React 19 + TypeScript 6 + Tailwind 4) plus a small API
that reads a Google Drive folder. See README.md for setup and deployment.

## Language rule (important)

**Everything related to development is in English**: identifiers, file names,
comments, CSS tokens, i18n message *keys*, ids, URL fragments, localStorage
keys, commit messages, PR descriptions and READMEs.

**Spanish appears only as content**: the values in `src/i18n/es.ts` (the
default language) and the sample posts in `core/demo-feed.ts`. English
(`en.ts`) and Simplified Chinese (`zh.ts`) are content too. Never put
user-visible text directly in components.

## Portability rule (important)

The API must keep running on Vercel and Cloudflare Pages unchanged:

- All API logic lives in `core/` as `handleApi(request: Request, env: Env)`
  returning a `Response`. Use only Web-standard APIs there (fetch, Request,
  Response, URL, crypto.subtle, TextEncoder, btoa/atob). No `node:` imports,
  no `process`, no `Buffer`, no Node-only packages (e.g. `googleapis`).
- Host code stays in the thin adapters: `api/index.ts` (Vercel),
  `functions/api/[[path]].ts` (Cloudflare), `scripts/vite-api-plugin.ts` (dev).
- Relative imports in `core/`, `api/` and `functions/` end in `.js` (Vercel
  runs them as Node ESM).
- Secrets come only from the `env` argument. Never commit keys: the repo is
  public. `.env*` (except `.env.example`) and `.dev.vars` are git-ignored.

## Site conventions

- `src/config.ts`: non-translated settings (brand, WhatsApp, ids).
- `src/i18n/types.ts`: the `Messages` type; lists that pair with code are
  `Record<Id, …>` or fixed tuples so a missing translation fails the build.
- `src/i18n/languages.ts`: registry; first entry is the default. Language comes
  from `?lang=`, then localStorage (`drive-cms:language`), then the default.
- `src/main.tsx`, `src/i18n/{context.ts,I18nProvider.tsx,languages.ts}`,
  `src/LanguagePicker.tsx`, `src/flags.tsx` are copied from
  JDaza13/static-sites; keep them in step with that repo.
- Design tokens in the `@theme` block of `src/index.css` (surface, ink, muted,
  line, deep, accent, accent-soft, card).

## Checks before pushing

```bash
pnpm install
pnpm test && pnpm build && pnpm lint
```

Verify 320px to 1440px in all three languages (no horizontal overflow), that
`?lang=en` / `?lang=zh` work, and the contact form's wa.me link.
