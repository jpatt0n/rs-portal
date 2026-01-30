import { Link } from "react-router-dom"

import SpaceBackdrop from "@/components/SpaceBackdrop"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CONTACT_EMAIL, SOCIAL_LINKS, TWITCH_URL } from "@/data/links"
import { useTwitchLiveStatus } from "@/lib/twitch"

const STATUS_COPY: Record<string, string> = {
  live: "Live now",
  offline: "Offline right now",
  checking: "Checking live status",
  disabled: "Live status ready to enable",
  error: "Status unavailable",
}

function Home() {
  const status = useTwitchLiveStatus("renderedsenseless")
  const discordLink = SOCIAL_LINKS[0]

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SpaceBackdrop />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
        <div className="text-xs uppercase tracking-[0.3em] text-white/40">
          Rendered Senseless
        </div>
        <Link
          to="/access"
          className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
        >
          Guest Access
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-10">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <img
              src="/assets/rendered-senseless-logo.png"
              alt="Rendered Senseless"
              className="w-full max-w-md animate-fade-up"
            />
            <h1 className="font-display pixel-shadow glow-soft text-3xl leading-tight text-[color:var(--accent)] sm:text-4xl lg:text-5xl animate-fade-up [animation-delay:120ms]">
              Earth's first interactive talk show... in space.
            </h1>
            <p className="max-w-xl text-base text-white/70 animate-fade-up [animation-delay:220ms]">
              Featuring guest interviews, games, and quests, with the audience
              controlling aspects of the show. Step into the broadcast and help
              steer the mission.
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-up [animation-delay:320ms]">
              <Button asChild size="lg">
                <a href={TWITCH_URL} target="_blank" rel="noreferrer">
                  Watch on Twitch
                </a>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href={discordLink.href} target="_blank" rel="noreferrer">
                  Join Discord
                </a>
              </Button>
            </div>
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
          </div>

          <div className="flex flex-col gap-6">
            <Card className="animate-fade-up [animation-delay:200ms]">
              <CardHeader>
                <CardTitle className="font-display text-lg uppercase tracking-[0.2em] text-white/80">
                  Stream Portal
                </CardTitle>
                <CardDescription>
                  The main broadcast channel for every episode.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Twitch • RenderedSenseless</p>
                    <p className="text-xs text-white/60">Live status &amp; watch link</p>
                  </div>
                  <Badge variant={status === "live" ? "live" : "outline"}>
                    {status === "live" ? "LIVE" : "OFFLINE"}
                  </Badge>
                </div>
                <Button asChild>
                  <a href={TWITCH_URL} target="_blank" rel="noreferrer">
                    Enter the Stream
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="animate-fade-up [animation-delay:320ms]">
              <CardHeader>
                <CardTitle className="font-display text-lg uppercase tracking-[0.2em] text-white/80">
                  Social Coordinates
                </CardTitle>
                <CardDescription>Stay synced with the show.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/30 hover:bg-white/10"
                  >
                    <div>
                      <p className="font-semibold text-white/90">{link.label}</p>
                      <p className="text-xs text-white/60">{link.description}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Open
                    </span>
                  </a>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-fade-up [animation-delay:440ms]">
              <CardHeader>
                <CardTitle className="font-display text-lg uppercase tracking-[0.2em] text-white/80">
                  Guest Access
                </CardTitle>
                <CardDescription>
                  Private portal for invited characters and crew.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link to="/access">Enter Access Portal</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card className="animate-fade-up [animation-delay:200ms]">
            <CardHeader>
              <CardTitle className="font-display text-lg uppercase tracking-[0.2em] text-white/80">
                Work With Us
              </CardTitle>
              <CardDescription>
                We collaborate with animators, game devs, improv talent, and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-white/70">
              <p>
                Want to help build the show? Reach out at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-white underline underline-offset-4"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
              <p>
                We are looking for artists, Unity builders, and collaborators
                who want to shape the next phase of the broadcast.
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-up [animation-delay:320ms]">
            <CardHeader>
              <CardTitle className="font-display text-lg uppercase tracking-[0.2em] text-white/80">
                Mission Snapshot
              </CardTitle>
              <CardDescription>Quick status from the ship.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Broadcast mode</span>
                <span className="text-white/90">Interactive live show</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Audience control</span>
                <span className="text-white/90">Enabled</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Next upgrade</span>
                <span className="text-white/90">Guest login portal</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 pb-10 text-xs text-white/50">
        <span>Rendered Senseless • All systems nominal.</span>
        <span>
          Built for launch — follow the portal links above to stay connected.
        </span>
      </footer>

      <div className="pointer-events-none absolute left-0 top-28 hidden w-44 -translate-x-6 lg:block">
        <img
          src="/assets/hostbot.png"
          alt="Hostbot"
          className="w-full animate-float opacity-80"
        />
      </div>
      <div className="pointer-events-none absolute right-0 top-40 hidden w-40 translate-x-6 lg:block">
        <img
          src="/assets/josh.png"
          alt="Josh character"
          className="w-full animate-float opacity-70"
        />
      </div>
      <div className="pointer-events-none absolute bottom-16 right-20 hidden w-44 lg:block">
        <img
          src="/assets/bird-king-kai.png"
          alt="Bird on King Kai"
          className="w-full animate-float opacity-80"
        />
      </div>
    </div>
  )
}

export default Home
