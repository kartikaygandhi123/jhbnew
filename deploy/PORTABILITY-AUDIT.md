# Portability audit — 18 October 2026

## Repository changes

- `vite.vps.config.ts`: native Vite/TanStack/React/Tailwind/Nitro Node stack, explicit environment and backend checks; no managed build wrapper in this target.
- `src/lib/backend-config.ts`, `external-client.ts`, `backend-server.ts`: one external backend, read-only legacy media normalization and build/runtime consistency.
- `src/lib/media-urls.ts`, `media-urls.test.ts`, `static-assets.json`: shared historical URL resolver, regression tests and 31-file inventory.
- `src/lib/content.ts`: external-storage YouTube cache on preview and VPS.
- `src/lib/public-content.functions.ts`, `src/routes/article.$id.tsx`: portable HTTPS article preview origin from runtime `SITE_ORIGIN`.
- `src/routes/api/public/media.$.ts`: external-only server credentials with configuration check; existing public known-path storage behavior retained.
- `src/routes/__root.tsx`: removed application dependency on optional managed error reporting.
- `src/lib/share-image.ts`: generated clipping uses the current site's host, not a fixed domain.
- `src/assets/jhb-logo-new.png.asset.json`: permanent `/jhb-logo.png` reference.
- `public/jhb-logo.png`, `public/assets/<asset-id>/<filename>`: actual full logo plus 31 historical logos/news images/e-paper PDF, pages and thumbnails. These are static historical fixtures, not a new writable data store.
- `.env.example`, `scripts/with-site-env.mjs`, `scripts/validate-portability.mjs`: placeholder configuration, safe operator env loading, asset/output validation.
- `.github/workflows/deploy-vps.yml`: regression tests and output validation before packaging.
- `README.md`, `deploy/README.md`, `deploy/FILEZILLA.md`, `AGENTS.md`, `roadmap.md`: repeatable source deployment and architecture/safety documentation.

## Audited data paths

`content.ts`, `admin.tsx`, `AdminTable.tsx`, `article-write.ts`, `upload.ts`, `epaper-upload.ts`, `useAuth.ts`, external auth/middleware and promo server functions use the external browser/server adapters. Staff saves use user sessions and existing RLS, not a privileged fallback. Service credentials are server-only for private media and scheduled YouTube storage. Browser auth session persistence is expected; query caches are memory-only. No records, schema, roles, auth settings, storage objects, DNS or VPS configuration were changed.

Unused generated managed integrations and historical migrations remain in source and must not be run for a code release. The managed build package remains a development dependency for the preview config; it is not imported by the independent VPS config. Application imports do not use the generated managed auth/client adapters. Historical pointer files are archival metadata, not the serving source. No live application image was observed referencing the managed asset service.

## Verified

- 17 article-write/news/media tests and 5 YouTube tests passed.
- Asset validator verified all 31 repository files by path/size plus the full local logo and native Node target configuration.
- Latest managed preview build diagnostics reported `build OK` after application edits.
- Browser homepage, pasted article, search, auth, e-paper, videos and Live TV returned 200 with no page errors; actual article photo loaded and local logo returned 200. Desktop screenshots were inspected.
- Read-only external checks found **3 articles, 0 editions and 0 e-paper pages**, rather than relying on earlier inventories. Three referenced article media objects were readable. No unknown legacy asset references were found in current public data. Missing/removed records were not restored; empty e-paper content is not a rendering verification of a PDF edition.
- All content leaf routes were inspected for unique titles/descriptions, Open Graph title/description/type and Twitter card. Absolute HTTPS article preview images use the image displayed by the page; relative images require `SITE_ORIGIN` for absolute social metadata.

## Remaining limitations and operator requirements

1. **Independent production build/output not executed here.** This environment prohibits manual project builds; only managed preview build diagnostics were available. Run the documented `build:vps` and `validate-portability.mjs --output` on a clean checkout/CI before claiming standalone runtime/output validation. The new CI gates perform this on the next authorized workflow run. No deployment was triggered here.
2. **Tracked generated `.env` and protected `.gitignore`.** Attempting the exclusions was rejected by the environment. The tracked file currently contains public managed details only. Correct tracking/exclusions locally as documented; private credentials must never enter it. Cannot claim all environment files are untracked.
3. **Staff workflows and actual VPS unverified.** No external staff session/VPS access was available, and this task forbids data-affecting tests. Preserve current auth/RLS; verify sign-in and publishing privately on the target before launch.
4. **YouTube initial refresh not run.** Starting its timer writes external cache and requires a valid API key/storage permissions. Cached playback remains dependent on that setup and YouTube embed access.
5. **Historical data completeness not established.** Static known historical files are bundled, but this is not a database/account migration. Existing e-paper tables are currently empty; restoring editions requires separate explicit approval, not automatic seed/import.
6. **GitHub sync is outside agent control.** Confirm accepted changes reach `main`; the agent did not push, force-push or change provider settings.

One-time external setup: Node/Bun installation, non-root user and narrow restart privileges, production environment credentials, existing backend auth redirects/Google/SMTP verification, private repository access, optional GitHub SSH secrets, Nginx/DNS/TLS and timer installation. Nothing in this report claims the current VPS was inspected, deployed, or the public domain moved.