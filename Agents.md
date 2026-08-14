# Rendered Senseless Portal (rs-portal)

## Purpose
- Vite/React SPA for `renderedsenseless.com` with `/access` as the guest portal.
- `/access` embeds the Unity RenderStreaming receiver UI natively (no iframe).
- Webcam guest mode extends the receiver UI with a webcam sender plus guest mode controls in the settings panel.

## Key paths
- `src/pages/Home.tsx` — main landing page and social/Twitch CTAs.
- `src/pages/Access.tsx` — native RenderStreaming receiver embed.
- `public/rs/` — RenderStreaming static assets synced from `UnityRenderStreaming/WebApp/client/public`.
- `public/rs/module/` — RenderStreaming ESM modules synced from `UnityRenderStreaming/WebApp/client/src`.
- `DEPLOYMENT.md` — cPanel build + SPA rewrite instructions.

## RenderStreaming integration
- `Access.tsx` injects `window.RENDER_STREAMING_CONFIG` with `signalingBaseUrl` + `basePath` (`/rs`) and RNNoise defaults for receiver mic denoising.
- Signaling base URL defaults to `https://stream.renderedsenseless.com` on production hostnames, `http://localhost:55055` on local dev.
- The page loads `/rs/css/main.css`, `/rs/receiver/css/style.css`, and dynamically imports `/rs/receiver/js/main.js`.
- The receiver expects specific DOM IDs (`#player`, `#warning`, `#message`, `#usernameInput`, `#micCheck`, etc.) which are rendered in `Access.tsx`.
- **The receiver DOM exists twice.** `Access.tsx` renders it for `/access`, and `UnityRenderStreaming/WebApp/client/public/index.html` is a standalone copy served at `localhost:55055` and `/rs/index.html`. The sync script does not reconcile them — it copies `WebApp/client/public` over `public/rs`, and `Access.tsx` is hand-maintained outside that path. Any new element must be added to **both**, or it silently no-ops on whichever page was missed (`main.js` null-guards every `getElementById`). `receiver/index.html` is only a redirect stub and is not the DOM.
- Webcam guest mode adds required DOM IDs (`#webcamCheck`, `#videoSource`, `#webcamPreview`, `#webcamPreviewPlaceholder`, `#webcamStateLabel`, `#webcamModeControls`, `#webcamPrimaryMode`, `#webcamSecondaryMode`). The mode controls live in the settings panel, not a separate dock.
- The connected toolbar carries `#micToggleButton` to the right of `#inputSettingsToggle`: a quick mic mute whose two inline SVGs (`.mic-icon--live` / `.mic-icon--muted`) are swapped by the `.is-muted` class. It and `#micCheck` are two views of one piece of state — `setMicEnabled` in the receiver's `main.js` is the only thing that moves it.
- The green room adds `#greenRoomBanner`, `#greenRoomTitle`, `#greenRoomDetail`: a persistent banner shown to a waiting guest, not a toast.
- There is no longer an interview flag on the connection id. A remote user becomes a webcam guest simply by sending a webcam video track; Unity binds the track and starts the session from that.
- Guest mode changes ride a dedicated data channel labelled `webcam-control`. The client sends `{type:"set-mode", mode}` and Unity replies with `{type:"state", mode, active}` or `{type:"error", error}`. Valid modes are `tv-screen`, `tv-man`, and `full-control` — these strings are a contract with `WebcamGuestModeCodec` in Lawgiven and must not be changed on one side only.
- Guests connect on entering the green room: they watch the main camera and hear the show, but the page opens no microphone and sends no webcam until Unity says so over the `green-room` data channel (`{type:"state", admitted, username}`, Unity → browser only). A cast member lets them in from the green room panel in Unity. Full flow in `UnityRenderStreaming/WebApp/ACCESS-CONTROL.md`.

## Syncing client assets
- Run `scripts/sync-renderstreaming-client.{sh,ps1}` whenever `UnityRenderStreaming/WebApp` changes. (These used to live in the `rs-website` wrapper repo that once contained this project; they moved here when rs-portal became standalone.)
- The sync copies WebApp client assets into `public/rs` and `public/rs/module` so the portal stays aligned with the signaling client.
- It finds UnityRenderStreaming at `../UnityRenderStreaming` by default; override with a path argument or `UNITY_RENDER_STREAMING_DIR`.
- **UnityRenderStreaming is the source of truth.** The sync overwrites and deletes under `public/rs`, so a fix made only here is lost on the next run. Make receiver changes upstream, then sync. A mobile-layout fix to `css/main.css` was stranded here for five months exactly this way.
- Pass `--check` (bash) or `-Check` (PowerShell) to report drift and exit non-zero without writing — use this before shipping a portal build.

## Deployment + runtime context
- Build with `npm run build` and upload `dist/` to cPanel (see `DEPLOYMENT.md` for `.htaccess` SPA routing).
- The portal is static hosting; the signaling/WebRTC server runs on the Azure VM (reverse-proxied at `stream.renderedsenseless.com`).
- The Unity app (Lawgiven) is the RenderStreaming host that the portal connects to via WebRTC.
