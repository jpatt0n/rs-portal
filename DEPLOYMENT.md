# Rendered Senseless Portal Deployment

## Build locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the static site:
   ```bash
   npm run build
   ```
3. Push to `main`. `.github/workflows/deploy.yml` builds and deploys over FTPS
   using the repository's existing FTP secrets. Cloudflare caches the resulting
   site; it is not the build host. For a manual deployment, upload `dist/` to the
   same cPanel document root for `renderedsenseless.com`.

The build gives the complete receiver tree a content-derived URL under
`/rs/releases/<version>/`. Upload that directory **before** publishing the new
`index.html` and Vite assets, and retain older release directories for clients
that still have the previous page open. Local development continues to use `/rs`.
Changing any mirrored receiver file changes the release URL on the next build;
relative imports, styles and audio worklets all stay within that release. The
GitHub workflow uploads the release first, with per-release FTP state, then
publishes the site while excluding release directories from root synchronization.
Production jobs are serialized so two pushes cannot interleave their uploads.

Upload `dist/.htaccess` too (enable hidden files in the upload tool). Purge cached
HTML for both `renderedsenseless.com` and `www.renderedsenseless.com` when deploying.
Cloudflare rules must respect the HTML's no-cache headers. Verify `/access` on
both hostnames loads the new `/rs/releases/<version>/receiver/js/main.js`.

This matters for the audio fix: on September 12, 2026, the apex hostname served
the old muted player while `www` served the updated player, both with
`Cache-Control: public, max-age=604800`. Updating files at the old `/rs` URLs did
not reliably update clients. Do not rely on a query string on `main.js` alone:
its relative imports would still use the cached, unversioned URLs.

## SPA routing (.htaccess)
Because the site uses client-side routing (`/access`), you need a rewrite rule so refreshes
and direct links resolve to `index.html`.

Create an `.htaccess` file in the same folder as `index.html`:
```
<IfModule mod_headers.c>
  <FilesMatch "^index\.html$">
    Header always set Cache-Control "no-store, no-cache, must-revalidate"
    Header always set Pragma "no-cache"
    Header always set Expires "0"
  </FilesMatch>
  # Keep RenderStreaming assets fresh to avoid mixed old/new JS module caches.
  SetEnvIf Request_URI "^/rs/" RS_ASSET=1
  Header always set Cache-Control "no-store, no-cache, must-revalidate" env=RS_ASSET
  Header always set Pragma "no-cache" env=RS_ASSET
  Header always set Expires "0" env=RS_ASSET
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Twitch live status
The live status widget is ready but disabled by default. Copy `.env.example` to `.env`
for local testing and set:
- `VITE_TWITCH_STATUS=true`
- `VITE_TWITCH_CLIENT_ID=...`
- `VITE_TWITCH_ACCESS_TOKEN=...`

For production, use a server-side token endpoint to avoid exposing secrets in the client.
