import { useEffect } from "react"
import { Link } from "react-router-dom"

import SpaceBackdrop from "@/components/SpaceBackdrop"
import { Button } from "@/components/ui/button"

const PROD_SIGNALING_BASE_URL = "https://stream.renderedsenseless.com"
const LOCAL_SIGNALING_PORT = 55055
const RENDER_STREAMING_BASE_PATH = "/rs"

declare global {
  interface Window {
    RENDER_STREAMING_CONFIG?: {
      signalingBaseUrl?: string
      basePath?: string
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
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SpaceBackdrop />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
        <div className="text-xs uppercase tracking-[0.3em] text-white/40">
          Rendered Senseless
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Return to Portal</Link>
        </Button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-16">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl text-[#65da97]">
            Access Portal
          </h1>
          <p className="mt-4 text-base text-white/90">
            Connect directly to the live RenderStreaming session. Enter your
            guest name, choose mic settings, and hit play to join the scene.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <div
              id="warning"
              hidden
              className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100"
            />
            <div
              id="player"
              className="overflow-hidden rounded-3xl border border-white/10 bg-black/70 shadow-[0_0_40px_rgba(0,0,0,0.35)]"
            />
            <div
              id="message"
              className="rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white/80"
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/50 p-6 text-white/80">
            <div className="flex flex-col gap-4">
              <div className="box">
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Codec Preferences
                </label>
                <select
                  id="codecPreferences"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  autoComplete="off"
                  disabled
                  defaultValue=""
                >
                  <option value="">
                    Default
                  </option>
                </select>
              </div>

              <div className="box">
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Lock Cursor to Player
                </label>
                <div className="mt-2 flex items-center gap-2 text-sm text-white">
                  <input
                    type="checkbox"
                    id="lockMouseCheck"
                    className="h-4 w-4 accent-[#65da97]"
                    autoComplete="off"
                  />
                  <span>Enable pointer lock</span>
                </div>
              </div>

              <div className="box">
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Username
                </label>
                <input
                  id="usernameInput"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  autoComplete="off"
                  placeholder="guest"
                />
              </div>

              <div className="box">
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Mic Settings
                </label>
                <div className="mt-2 flex items-center gap-2 text-sm text-white">
                  <input
                    type="checkbox"
                    id="micCheck"
                    className="h-4 w-4 accent-[#65da97]"
                    autoComplete="off"
                  />
                  <span>Send microphone audio</span>
                </div>
                <label className="mt-3 text-xs uppercase tracking-[0.2em] text-white/50">
                  Mic Device
                </label>
                <select
                  id="audioSource"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  autoComplete="off"
                />
              </div>

              <p className="text-xs text-white/60">
                If the stream does not appear, check that the signaling server is
                running and that your browser allows microphone access.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Access
