# Manual VPS upload with FileZilla

The preview and VPS save newsroom content and uploaded files to the **same external database and private media bucket**. FileZilla transfers website code, not database records. Newsroom edits do not need another project upload; code/design changes do.

## 1. One-time server preparation

Complete the Ubuntu, Node.js 22, Bun, service, Nginx and HTTPS preparation in [README.md](README.md). A file upload alone cannot run this application: it needs the Node website service, not static `public_html` hosting.

In FileZilla Site Manager choose **SFTP — SSH File Transfer Protocol**, normally port **22**, with the VPS SSH user/key. Verify the server fingerprint against Hostinger's trusted console. Do not use plain FTP: it exposes login details and file contents. Use the non-root deployment account authorized to write `/srv/jhb/releases` and restart only the `jhb` service.

Create `/etc/jhb/site.env` on the VPS only, with the external backend values described in README.md. `SUPABASE_SERVICE_ROLE_KEY` must be your external private key: the media endpoint needs it to serve newsroom uploads. Never upload a secret file into a public folder or commit it. Preview secrets do not transfer with the project.

Apply the checked-in `deploy/migrations` changes to the external database before deploying dependent code. Do not run the old migration script or re-import old newsroom content for a code release.

## 2. Upload a clean source release

Download the latest accepted source from the connected GitHub repository to your computer. Extract it before uploading. Keep a release folder separate from the currently running website.

Open the VPS SSH terminal and generate a unique release identifier:

```bash
openssl rand -hex 20
```

Copy the resulting 40-character value. Create `/srv/jhb/releases/<release-id>` in FileZilla and upload the source files **inside** that directory, including `src`, `public`, `scripts`, `deploy`, `package.json`, `bun.lock`, both Vite configurations, `tsconfig.json` and the other root configuration files. Enable viewing hidden files so needed source configuration is not missed.

**Do not upload** `.env`, `.env.*`, `.git`, `.github`, `node_modules`, `.output`, `dist`, `.lovable`, archives, local logs or credentials. Keep all existing `.asset.json` source pointers; deleting them breaks imports. Historical pointer files also require their media bytes to have been transferred to the external bucket, as described in README.md. Uploading pointers is not a media transfer.

Do not upload directly over `/srv/jhb/current`, and do not put source files into Nginx's public document directory.

## 3. Build and activate on the VPS

In the SSH terminal, replace `<release-id>` with the value generated above:

```bash
cd /srv/jhb/releases/<release-id>
/usr/local/bin/bun install --frozen-lockfile
/usr/local/bin/bun run test:migration
/usr/local/bin/bunx vitest run src/lib/article-write.test.ts src/lib/news-rules.test.ts
/usr/local/bin/bun run build:vps
bash deploy/activate-release.sh <release-id>
```

With no browser overrides, this build uses `src/lib/backend-config.ts`, the same external database configured for the preview. If supplying `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time, they must identify that same external database. The server's `/etc/jhb/site.env` must match it. Never place the private key in a `VITE_` variable.

Activation switches the release link, restarts the service and checks the homepage. If its health check fails it attempts to restore the previous release. Inspect failures with:

```bash
sudo systemctl status jhb --no-pager
sudo journalctl -u jhb -n 50 --no-pager
```

Do not continue with DNS cutover until the checks below pass. Do not repeatedly activate a release while investigating an incomplete upload.

## 4. Existing addresses and verification

The addresses stay unchanged:

| Page | Address |
| --- | --- |
| Homepage | `/` |
| Staff sign-in | `/auth` |
| Editor (no public menu link) | `/admin` |
| Article | `/article/<existing-article-id>` |
| Category | `/category/<existing-category-slug>` |
| Search | `/search?q=<search-text>` |
| E-paper | `/epaper` |
| Videos | `/videos` |
| Live TV | `/live-tv` |
| Uploaded file | `/api/public/media/<object-path>` |

Keep the provided Nginx `location /` proxy to the Node service. **Do not replace it with `try_files ... /index.html`**: page rendering, article previews, sign-in and media requests need the running application. Direct article links must work when pasted into a fresh browser and when refreshed.

After upload, sign in as real staff. Create a temporary article with a photo in the preview, open it on the VPS, edit it from the VPS and check the preview, then delete it and confirm it disappears from both hosts and latest news. Verify a PDF and photo through the VPS media address. These checks establish staff permissions and media availability; public reads alone do not.

Each code change requires another manual release upload and activation. The existing GitHub deployment remains optional; choose one deployment method per release to avoid simultaneous manual and automatic activations. Scheduled YouTube refresh still requires the service/timer setup in README.md.

## Still required before launch

VPS access and installed services, real staff sign-in/save/upload checks, external email/Google settings, HTTPS/domain cutover, and the remaining historical media transfer must be verified separately. This guide does not claim those steps have already happened.