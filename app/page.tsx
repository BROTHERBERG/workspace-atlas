import Link from "next/link"
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Search,
  Share2,
  CalendarCheck,
  Wand2,
  Briefcase,
  MapPin,
  Radar,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import FeaturedSpaces from "@/components/featured-spaces"
import SignalMarquee from "@/components/signal-marquee"
import {
  marketStats,
  webUpgradeLeads,
  talentLeads,
  bandColor,
  GENERATED_AT,
  type Band,
} from "@/lib/spaces"

const SIGNALS = [
  { icon: ShieldCheck, label: "Secure (HTTPS)", note: "Is the site served securely?" },
  { icon: Smartphone, label: "Mobile-ready", note: "Does it render on a phone?" },
  { icon: Search, label: "SEO meta", note: "Can Google describe it?" },
  { icon: Share2, label: "Social presence", note: "Links to live social profiles?" },
  { icon: CalendarCheck, label: "Booking CTA", note: "Can a member actually book?" },
]

export default function Home() {
  const s = marketStats()
  const webLeads = webUpgradeLeads()
  const talent = talentLeads()
  const liveOpening = talent.find((t) => t.hiring.confirmedOpening)
  const bands: Band[] = ["A", "B", "C", "D", "F"]
  const maxBand = Math.max(...bands.map((b) => s.bandCounts[b] || 0), 1)

  return (
    <div className="flex min-h-screen flex-col">
      {/* HERO — full viewport, marquee pinned above the fold */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col bg-[#1f1f1f] text-white">
        <div className="flex flex-1 items-center">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-10">
            {/* Left */}
            <div className="flex flex-col justify-center">
              <Badge className="mb-5 inline-flex w-fit items-center gap-1.5 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
                <MapPin className="h-3 w-3" /> Calgary & Alberta · live coworking intelligence
              </Badge>
              <h1 className="font-cal text-5xl leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl">
                Find the space.
                <br />
                Score the market.
                <br />
                <span className="text-[#f9cb16]">Hire the crew.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-gray-300">
                {s.total} real spaces. {s.scored} live website scans. Two lead pipelines hiding in one map.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/intelligence"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#f9cb16] px-7 text-sm font-bold text-black border-2 border-[#f9cb16] transition-all hover:bg-[#ffd83a]"
                >
                  <Radar className="h-4 w-4" /> Open the intelligence map
                </Link>
                <Link
                  href="/directory"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border-2 border-white/30 bg-transparent px-7 text-sm font-medium text-white transition-all hover:border-white"
                >
                  Browse the directory <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-5 text-xs text-gray-400">
                No estimates — every score comes from a real browser rendering the live site.
              </p>
            </div>

            {/* Right — live scan board (real distribution) */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md rounded-xl border-2 border-white/15 bg-black/40 p-6 shadow-[8px_8px_0px_0px_rgba(249,203,22,0.25)]">
                <div className="flex items-center justify-between">
                  <span className="font-cal text-lg">Live scan</span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    {GENERATED_AT}
                  </span>
                </div>
                <div className="mt-5 space-y-2.5">
                  {bands.map((b) => {
                    const count = s.bandCounts[b] || 0
                    const c = bandColor(b)
                    return (
                      <div key={b} className="flex items-center gap-3">
                        <span className="w-4 font-cal text-sm text-gray-300">{b}</span>
                        <div className="h-5 flex-1 overflow-hidden rounded bg-white/5">
                          <div
                            className={`h-full ${c.bg}`}
                            style={{ width: `${Math.max((count / maxBand) * 100, count ? 6 : 0)}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-sm font-medium text-gray-200">{count}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
                  <div>
                    <div className="font-cal text-2xl text-[#f9cb16]">{s.avgScore}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Avg score</div>
                  </div>
                  <div>
                    <div className="font-cal text-2xl text-orange-400">{s.webUpgradeCount}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Web leads</div>
                  </div>
                  <div>
                    <div className="font-cal text-2xl text-emerald-400">{s.talentCount}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Talent leads</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SignalMarquee />
      </section>

      {/* STAT BAND */}
      <section className="border-b-2 border-black bg-[#f9cb16]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x-2 divide-black/10 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-10">
          {[
            { n: s.total, l: "spaces mapped" },
            { n: s.calgary, l: "in Calgary" },
            { n: `${s.independents}`, l: "independent operators" },
            { n: s.liveOpenings, l: "hiring leadership now" },
          ].map((x, i) => (
            <div key={i} className="px-4 text-center">
              <div className="font-cal text-4xl text-black md:text-5xl">{x.n}</div>
              <div className="mt-1 text-sm font-medium text-black/70">{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-cal text-3xl tracking-tight sm:text-4xl">Calgary's best-scoring independents</h2>
              <p className="mt-2 max-w-2xl text-gray-500">
                The operators setting the bar for digital presence in the local market.
              </p>
            </div>
            <Link
              href="/directory"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-black px-6 text-sm font-medium text-white shadow-[3px_3px_0px_0px_rgba(249,203,22,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              All {s.total} spaces <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeaturedSpaces />
          </div>
        </div>
      </section>

      {/* TWO PIPELINES */}
      <section className="border-y-2 border-black bg-gray-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <h2 className="font-cal text-3xl tracking-tight sm:text-4xl">Two pipelines hiding in one map</h2>
          <p className="mt-2 max-w-2xl text-gray-500">
            The same scan that builds the directory surfaces who to call — and why.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* Web upgrade -> Crush */}
            <div className="flex flex-col rounded-xl border-2 border-black bg-white p-7 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-black bg-orange-100">
                  <Wand2 className="h-5 w-5 text-orange-600" />
                </span>
                <div>
                  <div className="font-cal text-xl">Web-services leads</div>
                  <div className="text-sm text-gray-500">Spaces with weak, broken or missing websites</div>
                </div>
              </div>
              <div className="mt-5 font-cal text-5xl text-orange-600">{webLeads.length}</div>
              <ul className="mt-4 space-y-2 text-sm">
                {webLeads.slice(0, 4).map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-800">{l.name}</span>
                    <span className="shrink-0 text-xs text-orange-600">
                      {!l.website
                        ? "no website"
                        : l.digital.signals.dnsResolves === false
                          ? "site offline"
                          : `score ${l.digital.score}`}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/intelligence#web-upgrade"
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-black hover:text-orange-600"
              >
                See every web-services lead <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Talent -> Bottle Rocket / Lean Six Search */}
            <div className="flex flex-col rounded-xl border-2 border-black bg-[#1f1f1f] p-7 text-white shadow-[6px_6px_0px_0px_rgba(249,203,22,1)]">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-[#f9cb16] bg-[#f9cb16]/15">
                  <Briefcase className="h-5 w-5 text-[#f9cb16]" />
                </span>
                <div>
                  <div className="font-cal text-xl">Recruitment leads</div>
                  <div className="text-sm text-gray-400">Operators surfacing hiring & leadership signals</div>
                </div>
              </div>
              <div className="mt-5 font-cal text-5xl text-[#f9cb16]">{talent.length}</div>
              {liveOpening && (
                <div className="mt-4 rounded-lg border border-[#f9cb16]/40 bg-[#f9cb16]/10 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#f9cb16]">Live opening</div>
                  <div className="mt-0.5 text-sm">
                    {liveOpening.name.split("—")[0].trim()} is hiring a Community Manager in Calgary.
                  </div>
                </div>
              )}
              <ul className="mt-4 space-y-2 text-sm">
                {talent
                  .filter((t) => !t.hiring.confirmedOpening)
                  .slice(0, 3)
                  .map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <span className="font-medium text-gray-200">{l.name.split("—")[0].trim()}</span>
                      <span className="shrink-0 text-xs text-gray-400">careers page live</span>
                    </li>
                  ))}
              </ul>
              <Link
                href="/intelligence#talent"
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[#f9cb16] hover:text-white"
              >
                Route to Bottle Rocket Search <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW THE SCORE WORKS */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <h2 className="font-cal text-3xl tracking-tight sm:text-4xl">How the score is measured</h2>
          <p className="mt-2 max-w-2xl text-gray-500">
            No vanity metrics. Each site is loaded in a real browser and checked against five signals that decide whether
            a member ever finds — and books — the space.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SIGNALS.map((sig) => (
              <div
                key={sig.label}
                className="rounded-lg border-2 border-black bg-gray-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <sig.icon className="h-6 w-6 text-black" />
                <div className="mt-3 font-cal">{sig.label}</div>
                <div className="mt-1 text-sm text-gray-500">{sig.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1f1f1f] py-16 text-white md:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-10">
          <h2 className="font-cal text-3xl tracking-tight sm:text-4xl md:text-5xl">
            A market map that pays for itself in one call.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-300">
            Every space scored, every lead sorted. Open the map and see who's worth a conversation today.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/intelligence"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#f9cb16] px-8 text-sm font-bold text-black transition-all hover:bg-[#ffd83a]"
            >
              <Radar className="h-4 w-4" /> Open the intelligence map
            </Link>
            <Link
              href="/score-my-space"
              className="inline-flex h-12 items-center justify-center rounded-md border-2 border-white/30 px-8 text-sm font-medium text-white transition-all hover:border-white"
            >
              Score a space
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
