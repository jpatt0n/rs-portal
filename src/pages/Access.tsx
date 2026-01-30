import { Link } from "react-router-dom"

import SpaceBackdrop from "@/components/SpaceBackdrop"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Access() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <SpaceBackdrop />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-8">
        <div className="text-xs uppercase tracking-[0.3em] text-white/40">
          Rendered Senseless
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Return to Portal</Link>
        </Button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-16">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl text-[#65da97]">
            Access Portal
          </h1>
          <p className="mt-4 text-base text-white/90">
            This is the private entry point for guest characters and crew.
            Authentication will be wired in once the Unity render streaming
            login is integrated.
          </p>
        </div>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="font-display text-lg tracking-[0.2em] text-white/80">
              Crew Login (Coming Soon)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Guest Name
                </label>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/40">
                  Locked until auth is enabled
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Access Code
                </label>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/40">
                  Secure token required
                </div>
              </div>
            </div>
            <Button variant="outline" disabled>
              Authenticate (offline)
            </Button>
            <p className="text-xs text-white/90">
              We will plug in the real-time show login once the streaming stack
              is connected. This page is intentionally quiet but discoverable.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default Access
