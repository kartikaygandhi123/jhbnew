# Jai Hind Bharat: external hosting

The Lovable preview and VPS now use the same user-owned database for content, sign-in and uploaded media. Both editors save directly to that database; there is no two-database replication. Hosting targets remain separate. Public connection details live in `src/lib/backend-config.ts`; private credentials are never committed.

## Current blockers

The external database accepts connections and public content reads. On 18 October 2026, live browser checks confirmed the homepage, article page and e-paper read from the external database with no page errors. The external inventory contains 15 articles, 6 categories, 0 videos, 1 live channel, 5 trending tags, 1 edition, 8 e-paper pages, 1 settings row, 5 advertisements, 1 profile and 1 role row. The managed source contains 2 articles, 6 categories, 3 videos, 1 live channel, 0 tags, 1 edition, 1 e-paper page, 1 settings row, 5 advertisements, 1 profile and 1 role row. Counts do not establish identical records or identity/media completeness. Do not overwrite newer destination content or restore deliberately deleted articles from the older source. Legacy asset references remain in external articles, e-paper and settings. VPS access and GitHub deployment credentials have not been supplied. Existing external staff must sign in again; old managed sessions do not transfer. Google OAuth, SMTP and signup settings require provider verification.

## Shared editor connection

- Preview browser: public URL/key in `src/lib/backend-config.ts`; no private key belongs here.
- Preview server: saved `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_PUBLISHABLE_KEY`, and `EXTERNAL_SUPABASE_SECRET_KEY` (last one for private media only).
- VPS: keep the GitHub build values and `/etc/jhb/site.env` settings below pointed at this same project. Code changes reach the VPS after a successful GitHub deployment; news edits need no code deployment.
- Apply `deploy/migrations/20261018-shared-news.sql` before this release (already applied to the configured destination). It adds kicker color and a single selected homepage article without changing existing news.
- Apply `deploy/migrations/20261018-article-reporter.sql` before the reporter editor release. It adds an optional reporter name without changing existing articles.
- Allow your public preview origin plus `/auth` and `https://jaihindbharat.com/auth` as OAuth return URLs in your external provider. Email/password sign-in uses the external staff account. OAuth inside an embedded preview may be restricted; open the preview as a standalone page if necessary.
- Shared articles refresh every minute while the page is visible and when returning to the page; local editor saves/deletes refresh all article displays immediately. Concurrent edits of the same row use last-save-wins, not a merge.
- Lovable Cloud cannot be detached from an existing project, but these application adapters no longer use it for news CRUD, sign-in, or uploaded media. Old checked-in logo/e-paper pointers remain legacy assets until their one-time media transfer is verified.

## 1. Validate and copy content

For a complete managed database and account transfer, use Lovable **More → Database → Manage → Settings → Export data**, then the Database card's **Export → Start export**. Download the resulting export. It includes database structure, records and account password hashes, but not storage files, secrets or sign-in provider configuration. Download storage files separately from **More → Storage**. Do not use the legacy `migration:external` script for this full export; it is not the supported Cloud export workflow.

Restore the official export into a separate staging database you own, not directly over the active external database. Compare source and destination records by stable ID and review missing records before importing anything: a missing row may be an intentional deletion, and the destination already contains newer newsroom work. Review the three source video rows separately because the current external videos table is empty. Do not blindly restore source profiles or roles over external staff identities. Move the downloaded media and legacy assets to external storage, then update references only after verifying the corresponding destination files. Pause editing during the final reviewed import. Keep the source intact until counts, representative content, media and staff sign-in have been verified.

Sign-in providers and sessions need separate configuration; the official database export does not configure OAuth or email delivery. Do not copy the old first-user automatic admin-assignment behavior into an external public-signup flow. Preserve external staff permissions unless a reviewed identity transfer explicitly changes them.

In the external project set Site URL to `https://jaihindbharat.com` and allowed redirects to `https://jaihindbharat.com/auth` plus localhost only during testing. Configure Google with the project's own OAuth callback, not the Lovable broker. Disable public signup, configure SMTP and password reset delivery, and enable breached-password protection when supported. Confirm these settings in the provider before launch; they are not inferred from code.

## 2. Prepare Hostinger Ubuntu VPS

Install Node.js 22, Bun, Nginx, Certbot and a firewall. Create a non-root `jhb` service user, `/srv/jhb/releases`, and `/etc/jhb`. Keep `/etc/jhb/site.env` owned by root, readable by the service group only (0640). Its real values belong only on the VPS:

```text
SUPABASE_URL=<your external project API origin>
SUPABASE_PUBLISHABLE_KEY=<your external publishable key>
SUPABASE_SERVICE_ROLE_KEY=<your external secret key>
YOUTUBE_API_KEY=<your YouTube API key>
```

These are descriptions, not working credentials. Never use the old managed project values on the VPS. Browser builds need only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the same external project. Without explicit build values, the application-owned public configuration is used; it never retries a failed write against Lovable Cloud.

Install `deploy/jhb.service`, `deploy/jhb-youtube.service` and `deploy/jhb-youtube.timer` into `/etc/systemd/system/`. Install the Nginx configuration, enable its site, and run `nginx -t`. Allow SSH, HTTP and HTTPS only; keep port 3000 bound to loopback. Grant the deployment user only permission to restart the `jhb` service via a narrow sudoers rule. Ensure `/usr/local/bin/bun` is installed and executable for that user. Do not grant general passwordless sudo.

## 3. Automatic releases from GitHub

For manual FileZilla uploads instead, follow [the SFTP release guide](FILEZILLA.md). It builds on the VPS, preserves the existing page addresses, and uses the same shared external database. Plain FTP is not recommended; use FileZilla's encrypted SFTP option. An upload alone does not start the website service.

The existing Git sync must target the repository's `main` branch, or edit the workflow branch to match. Lovable changes reach the VPS only AFTER they reach that synced Git branch; drafts do not deploy until accepted. Configure the GitHub production environment secrets: `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_PUBLISHABLE_KEY`, `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`. Obtain the SSH host key fingerprint through Hostinger's trusted console; do not bypass host verification. Project secrets in Lovable do not automatically transfer into GitHub or the VPS.

Each push builds the separate Node target, transfers a release, switches an atomic symlink, restarts the service and checks the homepage; on failed startup it restores the prior release. The workflow does NOT rerun the one-time migration or seed sample data. New future schema changes need explicit external migrations before deploying dependent code. One external database is used by all VPS releases, so newsroom uploads/content persist independently of code deployments.

## 4. Videos and Live TV

Run `systemctl start jhb-youtube.service` once and inspect its result, then enable `jhb-youtube.timer`. It runs twice daily, UTC 00:00 and 12:00 (05:30/17:30 India), with up to one minute spreading. It resolves the requested channel, fetches its uploads playlist and performs one live search per refresh, then stores `youtube/cache.json` in private media storage. Visitors read cached JSON; API keys never reach browsers. Failed refreshes retain the previous cache. Manually edited video entries take precedence over duplicates. Live status is a twice-daily snapshot, so a new live broadcast may not appear until the next refresh. YouTube embeds play directly from YouTube; the VPS does not rebroadcast video or bypass embed restrictions. Every video still depends on YouTube permitting embedding.

## 5. Cutover checklist

- Compare every table's counts and representative images/PDFs against source.
- Sign in as actual staff; create/read/edit/delete a temporary article and advertisement, upload a photo, then remove test records.
- Check homepage, search, article share previews, mobile header ads, e-paper full PDF/pages/thumbnails, video selection and Live TV fallback.
- Test Google sign-in and password-reset email delivery with external provider settings.
- Check first YouTube refresh and timer logs.
- Point domain A/AAAA records at the VPS only after verifying the VPS; remove stale AAAA if not serving IPv6.
- Issue HTTPS using Certbot, verify redirects and automatic certificate renewal.
- Keep an export/storage backup, confirm provider backups, monitor disk/memory/error logs, and test rollback.

No claim of unlimited traffic or attack-proof security is made. Load testing and a production security review remain necessary before a high-traffic launch.