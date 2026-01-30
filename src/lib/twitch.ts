import { useEffect, useState } from "react"

export type LiveStatus = "disabled" | "checking" | "live" | "offline" | "error"

const ENABLED = import.meta.env.VITE_TWITCH_STATUS === "true"
const OVERRIDE = import.meta.env.VITE_TWITCH_LIVE_OVERRIDE as
  | "live"
  | "offline"
  | "disabled"
  | undefined

export function useTwitchLiveStatus(channel: string) {
  const [status, setStatus] = useState<LiveStatus>(
    ENABLED ? "checking" : "disabled"
  )

  useEffect(() => {
    if (!ENABLED) {
      setStatus("disabled")
      return
    }

    if (OVERRIDE === "live" || OVERRIDE === "offline") {
      setStatus(OVERRIDE)
      return
    }

    const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID
    // For production, mint tokens server-side to avoid exposing secrets in the client.
    const accessToken = import.meta.env.VITE_TWITCH_ACCESS_TOKEN

    if (!clientId || !accessToken) {
      setStatus("disabled")
      return
    }

    let cancelled = false

    async function loadStatus() {
      try {
        const response = await fetch(
          `https://api.twitch.tv/helix/streams?user_login=${channel}`,
          {
            headers: {
              "Client-ID": clientId,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error("Twitch status request failed")
        }

        const data = (await response.json()) as { data?: unknown[] }
        if (!cancelled) {
          setStatus(data?.data?.length ? "live" : "offline")
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error")
        }
      }
    }

    loadStatus()

    return () => {
      cancelled = true
    }
  }, [channel])

  return status
}
