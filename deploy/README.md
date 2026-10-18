# Jai Hind Bharat: repeatable Linux VPS deployment

The VPS build runs independently using Vite, TanStack Start and Nitro's Node server. Lovable is a development editor only. Articles, categories, staff accounts/roles, settings, ads, live channels, videos, editions, pages and new uploaded media use the existing external backend. No local data store or database copy is created by deployment. Do not run `migration:external`, seed scripts, or old migrations when deploying this existing database.

## Deployment architecture (single, consistent layout)

The long-term layout used by the workflow, service templates, activation script and this guide is:

- Releases: `/srv/jhb/releases/<40-hex-id>` (one per deployment, never overwritten)
- Live symlink: `/srv/jhb/current` → active release (switched atomically by `deploy/activate-release.sh`)
- Service: systemd unit `jhb` (`deploy/jhb.service`), Node on `127.0.0.1:3000`, environment from `/etc/jhb/site.env`
- Scheduled YouTube refresh: `jhb-youtube.timer` in the same release layout
- Rollback: re-run `activate-release.sh` with the prior release identifier; the script also auto-restores the previous release if the health check fails

An older server may still run from a legacy path such as `/opt/jaihindbharat`. Do not mix the two: migrate once by installing a release under `/srv/jhb/releases`, activating it, verifying the health check, and only then retiring the legacy directory and old unit. Do not claim a successful production deployment until the target paths and permissions are verified on the server itself.

## 1. Prepare Ubuntu 24.04

As a server administrator, install security updates and tools:

```sh
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git curl unzip ufw
sudo adduser --disabled-password --gecos '' jhb
sudo install -d -o jhb -g jhb /srv/jhb/releases
sudo install -d -o root -g jhb -m 0750 /etc/jhb
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Install Node.js **22.22 or newer in the 22 series**, from a trusted official distribution/package source, at `/usr/bin/node`. Install Bun **1.3.3** using its official versioned installer and make it available at `/usr/local/bin/bun` to the service and deployment users. Verify `node --version` and `bun --version`. The lockfile is required; use `bun install --frozen-lockfile`, not an unlocked dependency update. A KVM 2 server builds with development dependencies; do not use `--production` before compiling.

Keep SSH key-only access, retain a trusted console recovery method, and verify the host fingerprint. Do not expose port 3000 publicly.

## 2. Configure once, outside Git

Copy `.env.example` to `/etc/jhb/site.env`, replace its placeholders privately, then set ownership `root:jhb` and mode `0640`. It is dotenv syntax, not a shell script. Do not place this file in any release or web directory.

| Variable | Required at | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Build + runtime | Existing external API URL; builds reject a different project |
| `SUPABASE_PUBLISHABLE_KEY` | Build + runtime | Public key; becomes browser configuration |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime | External private storage credential; never browser code |
| `SITE_ORIGIN` | Runtime | HTTPS test/production origin for article image previews |
| `YOUTUBE_API_KEY` | Timer only | YouTube Data API v3 refresh; not needed for cached playback |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Optional build only | Overrides; must equal corresponding runtime values |

Use the existing backend's URL and keys, not the managed `.env`. The VPS build ignores repository `.env` files. Build and runtime must match; a mismatch is rejected rather than silently splitting staff identities/content. Service-role credentials are only used to read private known media paths and by the scheduled cache writer. Ordinary editor writes use staff sessions and existing RLS.

Managed preview uses the application-owned external public defaults and saved `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_PUBLISHABLE_KEY`, `EXTERNAL_SUPABASE_SECRET_KEY`. It does not fall back to managed content on failure.

**Git safety limitation:** this environment protects `.gitignore` and the generated tracked `.env`, so its tracking could not be corrected here. Before a real release, locally add `.env` and `.env.*` exclusions with `!.env.example`, remove `.env` from Git's index while preserving the local file, and commit that change. Also exclude private `.key`/`.pem` files. Never enter private credentials into the managed generated `.env`. Rotate any credentials previously pasted into chat or committed; deleting a current file does not remove old history. The current `.env` contains public managed connection details only, not a service key.

## 3. Build a new immutable release

Run as `jhb` or a scoped deployment user:

```sh
release=$(openssl rand -hex 20)
git clone --branch main https://github.com/kartikaygandhi123/jhbnew.git /srv/jhb/releases/$release
cd /srv/jhb/releases/$release
bun install --frozen-lockfile
bun run test:migration
bunx vitest run src/lib/article-write.test.ts src/lib/news-rules.test.ts src/lib/media-urls.test.ts
node scripts/with-site-env.mjs /etc/jhb/site.env bun run build:vps
node scripts/validate-portability.mjs --output
```

Use an SSH/deploy key for a private repository; never embed its token in a clone URL. `with-site-env.mjs` reads the same production file used by systemd and prints no values. No source edits or separate logo uploads are needed. Static files are under `.output/public`; the server entry is `.output/server/index.mjs`. All 31 recovered historical static files, the real logo and favicon are in the repository. New editorial media is uploaded to the existing private `media` bucket and survives release changes.

Known historical URLs are translated on reads to repository files, without editing stored database values. Unknown legacy objects resolve to external `media/migrated/assets/...`; their bytes must exist there. There were no unknown legacy references in current public records during this audit. Future developer-added static graphics must be checked in as actual files with the same release, not just managed CDN pointers. Future staff-managed graphics should be uploaded through the existing editor.

## 4. Service and activation

Install `deploy/jhb.service` into `/etc/systemd/system/`. It uses `/usr/bin/node`, user/group `jhb`, loopback port 3000, the `current` symlink and `/etc/jhb/site.env`. Install the YouTube service/timer if required. Run:

```sh
sudo systemctl daemon-reload
sudo systemctl enable jhb
```

Authorize only the deployment user's restart of `jhb` via a narrow sudoers rule using `visudo` (confirm your systemctl path). Do not grant general passwordless sudo. Activate as that user from the release directory:

```sh
bash deploy/activate-release.sh "$release"
curl --fail http://127.0.0.1:3000/
sudo systemctl status jhb --no-pager
```

Activation checks the server entry, switches the symlink atomically, restarts and health-checks the homepage, restoring the prior release on failure where available. First deployment has no previous release. Health status alone does not establish database permissions, media availability or successful staff editing.

## 5. Nginx and HTTPS (operator actions, not performed here)

`deploy/nginx.conf` is the proxy template. Copy it to `/etc/nginx/sites-available/jhb`, replace `server_name` with the selected test/production hostname as infrastructure configuration, enable the site, and run `sudo nginx -t` before reloading. Keep `location /` proxying to the running Node service; never replace it with a static `index.html` fallback. This preserves `/article/...`, `/category/...`, `/auth`, `/admin`, `/epaper`, `/videos`, `/live-tv`, `/search` and `/api/public/media/...` including pasted URLs and reloads.

When separately authorized, set A/AAAA records to the VPS (remove an unusable IPv6 record), issue HTTPS via `sudo certbot --nginx -d YOUR_DOMAIN`, and run `sudo certbot renew --dry-run`. Update `SITE_ORIGIN` in `/etc/jhb/site.env`, then restart `jhb`; no application source edit is needed for `.cloud` versus `.com`.

In the existing external auth provider, verify the Site URL, approved same-origin `/auth` callbacks for test/production/preview, Google credentials and SMTP. Direct Google OAuth uses that provider, not the Lovable broker. Preserve existing accounts, role assignments and RLS. No auth/provider settings were changed in this task.

## 6. Videos and Live TV

Enable YouTube Data API v3 for your API key. Never supply a stream key: embeds play directly from YouTube; no rebroadcasting/media server is used. The standalone script reads `YOUTUBE_API_KEY` and writes durable JSON to **external storage** `media/youtube/cache.json`, never the VPS filesystem. Visitors on both preview and VPS read cached JSON through the media endpoint, not the YouTube API. Manual database videos win on duplicates. Detected live stream wins, otherwise the latest upload is used. Failed refresh keeps previous JSON.

```sh
sudo systemctl start jhb-youtube.service
sudo journalctl -u jhb-youtube.service -n 30 --no-pager
sudo systemctl enable --now jhb-youtube.timer
systemctl list-timers jhb-youtube.timer
```

Refresh is twice daily at UTC 00:00/12:00 with up to one minute spreading. Live status may lag twelve hours, and embedding must be permitted by YouTube. Timer activation writes the cache; it was deliberately not run during this read-only-data portability task.

## 7. Updates, rollback and operations

Clone each update into a new release directory and repeat tests/build/activation; do not pull or upload over `/srv/jhb/current`. News edits do not require new releases. Keep at least the prior known-good release. For manual rollback, run that prior directory's `deploy/activate-release.sh` with its 40-character identifier. Shared database changes cannot be rolled back by changing code; none are required or authorized here.

For FileZilla use [FILEZILLA.md](FILEZILLA.md), encrypted SFTP, separate releases and the same build flow. Optional GitHub Actions uses `main` and production secrets `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_PUBLISHABLE_KEY`, `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`. Runtime secrets stay on the VPS. Do not run automatic and manual activation simultaneously. Git sync status/branch must be verified in Lovable settings; this agent cannot push or verify provider sync.

Troubleshooting: `sudo journalctl -u jhb -n 50 --no-pager`, `sudo nginx -t`, `sudo systemctl status jhb`. A backend mismatch needs matching environment values and a new build; media 503 needs the external storage secret; media 404 means missing object/path; Google failures need provider/callback verification. Keep logs private and do not print credentials.

Before launch, verify real staff create/edit/upload/delete, deep-link refresh, PDFs/images, ads, search, social previews and YouTube cache on the actual VPS. Keep external database/storage backups, monitor resources and test rollback. Credentials, DNS, certificates, provider configuration and service installation cannot live in Git. No traffic capacity/security guarantee is made. See [PORTABILITY-AUDIT.md](PORTABILITY-AUDIT.md) for what was and was not checked.