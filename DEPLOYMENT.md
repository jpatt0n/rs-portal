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
3. Upload the contents of `dist/` to your cPanel document root for `renderedsenseless.com`.

## SPA routing (.htaccess)
Because the site uses client-side routing (`/access`), you need a rewrite rule so refreshes
and direct links resolve to `index.html`.

Create an `.htaccess` file in the same folder as `index.html`:
```
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
