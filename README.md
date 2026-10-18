# Jai Hind Bharat

Hindi newsroom, e-paper, articles, advertising, videos and Live TV built with TanStack Start, Vite and Nitro. The application uses the existing external backend for all records, staff accounts and uploads. No database import or seed is part of a code deployment.

## Fresh VPS deployment

See [deploy/README.md](deploy/README.md) for Ubuntu setup, environment configuration, Node service, HTTPS, updates and rollback. For manual uploads see [deploy/FILEZILLA.md](deploy/FILEZILLA.md). [.env.example](.env.example) documents placeholders only.

```sh
bun install --frozen-lockfile
node scripts/with-site-env.mjs /etc/jhb/site.env bun run build:vps
node scripts/validate-portability.mjs --output
node .output/server/index.mjs
```

Node.js 22.22+ and Bun 1.3.3 are the validated tool versions. Production uses the independent `vite.vps.config.ts`; the managed development preview keeps `vite.config.ts`. `public/jhb-logo.png` and historical static media are included in Git; new staff uploads are in external storage, not a VPS release directory.

## Tests

```sh
bun run test:migration
bunx vitest run src/lib/article-write.test.ts src/lib/news-rules.test.ts src/lib/media-urls.test.ts
node scripts/validate-portability.mjs
```

## Development and Git

Lovable remains an optional editor. Accepted changes sync to the connected repository branch; verify Git sync in Project settings. GitHub is a source-code repository, not a copy of the live database or staff credentials. Use the lockfile and never upload environment files.

See [the portability audit](deploy/PORTABILITY-AUDIT.md) for verified results and limitations, including the managed tracked `.env` restriction and outstanding production validation.
