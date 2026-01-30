import { type CSSProperties, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import SpaceBackdrop from "@/components/SpaceBackdrop"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CONTACT_EMAIL, SOCIAL_LINKS, TWITCH_URL } from "@/data/links"
import { useTwitchLiveStatus } from "@/lib/twitch"

const STATUS_COPY: Record<string, string> = {
  live: "Live now",
  offline: "Offline right now",
  checking: "Checking live status",
  disabled: "",
  error: "Status unavailable",
}

const SOCIAL_ICONS: Record<string, string> = {
  Discord: "/assets/brand-icons/discord.svg",
  YouTube: "/assets/brand-icons/youtube.svg",
  Instagram: "/assets/brand-icons/instagram.svg",
  Facebook: "/assets/brand-icons/facebook.svg",
  Twitter: "/assets/brand-icons/x.svg",
}

const HERO_IMAGES = [
  {
    src: "/assets/bird-king-kai.png",
    alt: "Bird King Kai character",
    fadeStop: "65%",
    className: "",
  },
  {
    src: "/assets/hostbot.png",
    alt: "Hostbot character",
    fadeStop: "65%",
    className: "",
  },
  {
    src: "/assets/josh.png",
    alt: "Josh character",
    fadeStop: "65%",
    className: "",
  },
]

function Home() {
  const status = useTwitchLiveStatus("renderedsenseless")
  const discordLink = SOCIAL_LINKS[0]
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % HERO_IMAGES.length)
    }, 6500)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SpaceBackdrop />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
        <div className="text-xs uppercase tracking-[0.3em] text-white/40">
          Rendered Senseless
        </div>
        <Link
          to="/access"
          className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 transition hover:border-white/40 hover:text-white"
        >
          Guest Access
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-10">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6 pt-4">
            <div className="relative w-full max-w-sm aspect-square overflow-hidden px-2 animate-fade-up [animation-delay:60ms]">
              {HERO_IMAGES.map((image, index) => (
                <img
                  key={image.src}
                  src={image.src}
                  alt={index === heroIndex ? image.alt : ""}
                  aria-hidden={index !== heroIndex}
                  style={
                    {
                      "--fade-mask-stop": image.fadeStop ?? "60%",
                    } as CSSProperties
                  }
                  className={`absolute bottom-0 left-1/2 h-auto w-auto max-h-full max-w-full -translate-x-1/2 transition-opacity duration-[1200ms] ease-in-out fade-mask-bottom ${image.className} ${
                    index === heroIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
            <h1 className="font-display text-xl leading-tight text-[#65da97] animate-fade-up [animation-delay:120ms]">
              Earth's first interactive talk show... in space.
            </h1>
            <p className="max-w-xl text-base text-white/90 animate-fade-up [animation-delay:220ms]">
              Featuring guest interviews, games, and quests, with the audience
              controlling aspects of the show. Step into the broadcast and help
              steer the mission.
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-up [animation-delay:320ms]">
              <Button asChild size="lg">
                <a href={TWITCH_URL} target="_blank" rel="noreferrer">
                  <img
                    src="/assets/brand-icons/twitch.svg"
                    alt=""
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Watch on Twitch
                </a>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href={discordLink.href} target="_blank" rel="noreferrer">
                  <img
                    src="/assets/brand-icons/discord.svg"
                    alt=""
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Join Discord
                </a>
              </Button>
            </div>
            {status !== "disabled" && (
              <div className="flex items-center gap-3 text-sm text-white/60 animate-fade-up [animation-delay:420ms]">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    status === "live"
                      ? "bg-emerald-400 animate-pulse-glow"
                      : "bg-white/30"
                  }`}
                />
                <span>{STATUS_COPY[status]}</span>
                {status === "live" && <Badge variant="live">LIVE</Badge>}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <Card className="animate-fade-up [animation-delay:200ms]">
              <CardHeader>
                <CardTitle className="font-display text-lg text-white/80">
                  Broadcast Portal
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <a
                  href={TWITCH_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/30 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/brand-icons/twitch.svg"
                      alt=""
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-semibold">Twitch</p>
                  </div>
                  <Badge variant={status === "live" ? "live" : "outline"}>
                    {status === "live" ? "LIVE" : "OFFLINE"}
                  </Badge>
                </a>
              </CardContent>
            </Card>

            <Card className="animate-fade-up [animation-delay:320ms]">
              <CardHeader>
                <CardTitle className="font-display text-lg text-white/80">
                  Social Coordinates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {SOCIAL_LINKS.map((link, index) => {
                  const actions = ["CHAT", "WATCH", "SWIPE", "UNC", "TROLL"]
                  const action = actions[index] ?? "OPEN"

                  return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/30 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={SOCIAL_ICONS[link.label]}
                        alt=""
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      <p className="font-semibold text-white/90">{link.label}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/50">
                      {action}
                    </span>
                  </a>
                  )
                })}
              </CardContent>
            </Card>
            <Card className="animate-fade-up [animation-delay:440ms]">
              <CardHeader>
                <CardTitle className="font-display text-lg text-white/80">
                  Work With Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/90">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex min-h-12 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/30 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/brand-icons/mail.svg"
                      alt=""
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    <p className="font-semibold text-white/90">Email</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Send
                  </span>
                </a>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
