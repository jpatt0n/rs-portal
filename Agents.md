# Rendered Senseless Portal (rs-portal)

## Purpose
- Vite/React SPA for `renderedsenseless.com` with `/access` as the guest portal.
- `/access` embeds the Unity RenderStreaming receiver UI natively (no iframe).
- Interview mode extends the receiver UI with a webcam sender + bottom dock controls.

## Key paths
- `src/pages/Home.tsx` — main landing page and social/Twitch CTAs.
- `src/pages/Access.tsx` — native RenderStreaming receiver embed.
- `public/rs/` — RenderStreaming static assets synced from `UnityRenderStreaming/WebApp/client/public`.
- `public/rs/module/` — RenderStreaming ESM modules synced from `UnityRenderStreaming/WebApp/client/src`.
- `DEPLOYMENT.md` — cPanel build + SPA rewrite instructions.

## RenderStreaming integration
- `Access.tsx` injects `window.RENDER_STREAMING_CONFIG` with `signalingBaseUrl` + `basePath` (`/rs`).
- Signaling base URL defaults to `https://stream.renderedsenseless.com` on production hostnames, `http://localhost:55055` on local dev.
- The page loads `/rs/css/main.css`, `/rs/receiver/css/style.css`, and dynamically imports `/rs/receiver/js/main.js`.
- The receiver expects specific DOM IDs (`#player`, `#warning`, `#message`, `#usernameInput`, `#micCheck`, etc.) which are rendered in `Access.tsx`.
- Interview mode adds required DOM IDs (`#interviewCheck`, `#interviewWebcamSection`, `#webcamCheck`, `#videoSource`, `#webcamPreview`, `#interviewDock`, `#dockMicToggle`, `#dockCamToggle`, `#dockDisconnect`, `#dockExitInterview`).
- Interview connections are tagged in the connection id as `_interview_` so Unity can lock input and accept webcam tracks.

## Syncing client assets
- Run `rs-website/scripts/sync-renderstreaming-client.{sh,ps1}` whenever `UnityRenderStreaming/WebApp` changes.
- The sync copies WebApp client assets into `public/rs` and `public/rs/module` so the portal stays aligned with the signaling client.

## Deployment + runtime context
- Build with `npm run build` and upload `dist/` to cPanel (see `DEPLOYMENT.md` for `.htaccess` SPA routing).
- The portal is static hosting; the signaling/WebRTC server runs on the Azure VM (reverse-proxied at `stream.renderedsenseless.com`).
- The Unity app (Lawgiven) is the RenderStreaming host that the portal connects to via WebRTC.
