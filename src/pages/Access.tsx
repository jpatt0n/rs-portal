import { useEffect } from "react"

const PROD_SIGNALING_BASE_URL = "https://stream.renderedsenseless.com"
const LOCAL_SIGNALING_PORT = 55055
const RENDER_STREAMING_BASE_PATH = "/rs"
const BODY_CLASS = "rs-app"

declare global {
  interface Window {
    RENDER_STREAMING_CONFIG?: {
      signalingBaseUrl?: string
      basePath?: string
      iceServers?: RTCIceServer[]
    }
    __lawgivenReceiverModulePromise?: Promise<unknown>
  }
}

const resolveSignalingBaseUrl = () => {
  const { hostname } = window.location

  if (
    hostname === "renderedsenseless.com" ||
    hostname === "www.renderedsenseless.com" ||
    hostname.endsWith(".renderedsenseless.com")
  ) {
    return PROD_SIGNALING_BASE_URL
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost:${LOCAL_SIGNALING_PORT}`
  }

  return `http://${hostname}:${LOCAL_SIGNALING_PORT}`
}

const ensureStylesheet = (id: string, href: string) => {
  if (document.getElementById(id)) {
    return
  }

  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = href
  document.head.appendChild(link)
}

const ensureScript = (id: string, src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve()
      } else {
        existing.addEventListener("load", () => resolve(), { once: true })
        existing.addEventListener("error", () => reject(), { once: true })
      }
      return
    }

    const script = document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.addEventListener("load", () => {
      script.dataset.loaded = "true"
      resolve()
    })
    script.addEventListener("error", () => reject())
    document.body.appendChild(script)
  })

function Access() {
  useEffect(() => {
    const body = document.body
    body.classList.add(BODY_CLASS)
    body.dataset.state = "ready"

    const existingConfig = window.RENDER_STREAMING_CONFIG || {}
    window.RENDER_STREAMING_CONFIG = {
      signalingBaseUrl: existingConfig.signalingBaseUrl ?? resolveSignalingBaseUrl(),
      basePath: existingConfig.basePath ?? RENDER_STREAMING_BASE_PATH,
    }

    ensureStylesheet("renderstreaming-main-css", `${RENDER_STREAMING_BASE_PATH}/css/main.css`)
    ensureStylesheet("renderstreaming-receiver-css", `${RENDER_STREAMING_BASE_PATH}/receiver/css/style.css`)

    const loadReceiver = async () => {
      await Promise.all([
        ensureScript("renderstreaming-adapter", "https://webrtc.github.io/adapter/adapter-latest.js"),
        ensureScript("renderstreaming-event-target", "https://unpkg.com/event-target@latest/min.js"),
        ensureScript(
          "renderstreaming-resize-observer",
          "https://unpkg.com/resize-observer-polyfill@1.5.0/dist/ResizeObserver.global.js"
        ),
      ])

      if (!window.__lawgivenReceiverModulePromise) {
        window.__lawgivenReceiverModulePromise = import(
          /* @vite-ignore */ `${RENDER_STREAMING_BASE_PATH}/receiver/js/main.js`
        )
      }

      await window.__lawgivenReceiverModulePromise
    }

    void loadReceiver()

    return () => {
      body.classList.remove(BODY_CLASS)
      delete body.dataset.state
    }
  }, [])

  return (
    <div id="container">
      <div id="warning" hidden />

      <div id="player">
        <div id="overlay">
          <div id="settingsPanel" className="panel">
            <div className="panel-header">
              <div className="panel-title">Join Session</div>
              <button
                id="settingsToggle"
                className="icon-button"
                type="button"
                aria-expanded="false"
                aria-controls="settingsMenu"
                title="Settings"
              >
                <svg
                  height="512"
                  viewBox="0 0 32 32"
                  width="512"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  focusable="false"
                >
                  <g>
                    <path d="m29.21 11.84a3.92 3.92 0 0 1 -3.09-5.3 1.84 1.84 0 0 0 -.55-2.07 14.75 14.75 0 0 0 -4.4-2.55 1.85 1.85 0 0 0 -2.09.58 3.91 3.91 0 0 1 -6.16 0 1.85 1.85 0 0 0 -2.09-.58 14.82 14.82 0 0 0 -4.1 2.3 1.86 1.86 0 0 0 -.58 2.13 3.9 3.9 0 0 1 -3.25 5.36 1.85 1.85 0 0 0 -1.62 1.49 14.14 14.14 0 0 0 -.28 2.8 14.32 14.32 0 0 0 .19 2.35 1.85 1.85 0 0 0 1.63 1.55 3.9 3.9 0 0 1 3.18 5.51 1.82 1.82 0 0 0 .51 2.18 14.86 14.86 0 0 0 4.36 2.51 2 2 0 0 0 .63.11 1.84 1.84 0 0 0 1.5-.78 3.87 3.87 0 0 1 3.2-1.68 3.92 3.92 0 0 1 3.14 1.58 1.84 1.84 0 0 0 2.16.61 15 15 0 0 0 4-2.39 1.85 1.85 0 0 0 .54-2.11 3.9 3.9 0 0 1 3.13-5.39 1.85 1.85 0 0 0 1.57-1.52 14.5 14.5 0 0 0 .26-2.53 14.35 14.35 0 0 0 -.25-2.67 1.83 1.83 0 0 0 -1.54-1.49zm-8.21 4.16a5 5 0 1 1 -5-5 5 5 0 0 1 5 5z" />
                  </g>
                </svg>
              </button>
            </div>

            <div className="field">
              <label htmlFor="usernameInput">Username</label>
              <input id="usernameInput" autoComplete="off" placeholder="guest" />
            </div>

            <div className="field">
              <label>Microphone</label>
              <div className="mic-row">
                <label className="toggle">
                  <input type="checkbox" id="micCheck" autoComplete="off" defaultChecked />
                  <span id="micStateLabel">Enabled</span>
                </label>
                <select id="audioSource" autoComplete="off" />
              </div>
            </div>

            <div className="section-header">INTERVIEW</div>
            <label className="checkbox-row">
              <input type="checkbox" id="interviewCheck" autoComplete="off" />
              <span>Join in Interview Mode</span>
            </label>

            <div id="interviewWebcamSection" className="field interview-section" hidden>
              <label>Webcam</label>
              <div className="mic-row">
                <label className="toggle">
                  <input type="checkbox" id="webcamCheck" autoComplete="off" />
                  <span id="webcamStateLabel">Disabled</span>
                </label>
                <select id="videoSource" autoComplete="off" />
              </div>
              <div className="webcam-preview" aria-live="polite">
                <video id="webcamPreview" muted playsInline />
                <div id="webcamPreviewPlaceholder" className="webcam-preview__placeholder">
                  Webcam preview is off
                </div>
              </div>
            </div>

            <button id="joinButton" type="button">Join</button>

            <div id="settingsMenu" className="settings-menu" hidden>
              <div className="field compact">
                <label htmlFor="codecPreferences">Codec preferences</label>
                <select
                  id="codecPreferences"
                  autoComplete="off"
                  disabled
                  defaultValue=""
                >
                  <option value="">Default</option>
                </select>
              </div>
              <label className="checkbox-row">
                <input type="checkbox" id="lockMouseCheck" autoComplete="off" />
                <span>Lock cursor to player</span>
              </label>
            </div>
          </div>

          <div id="statusMessage" className="status toast" aria-live="polite" hidden />

          <button id="statsToggle" className="ghost-button" type="button" aria-expanded="false" hidden>
            Stats
          </button>
          <div id="statsPanel" className="stats-panel" hidden>
            <div id="message" />
          </div>

          <button id="disconnectButton" className="ghost-button disconnect" type="button" hidden>
            Disconnect
          </button>

          <div id="interviewDock" className="interview-dock" hidden>
            <button id="dockMicToggle" className="dock-button" type="button" aria-pressed="true">
              <span className="dock-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12Z" />
                </svg>
              </span>
              <span className="dock-label">Mic</span>
            </button>
            <button id="dockCamToggle" className="dock-button" type="button" aria-pressed="false">
              <span className="dock-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="M17 7a2 2 0 0 1 2 2v.5l3-2.25v9.5L19 14.5V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h12Z" />
                </svg>
              </span>
              <span className="dock-label">Cam</span>
            </button>
            <button id="dockDisconnect" className="dock-button dock-danger" type="button">
              <span className="dock-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="M16 7h-2v2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2v2h2a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4ZM4 12l4-4v3h6v2H8v3l-4-4Z" />
                </svg>
              </span>
              <span className="dock-label">Disconnect</span>
            </button>
            <button id="dockExitInterview" className="dock-button" type="button">
              <span className="dock-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="M14 7v2h4v10H8v-4H6v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4ZM3 12l4 4v-3h7v-2H7V8l-4 4Z" />
                </svg>
              </span>
              <span className="dock-label">Exit Interview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Access
