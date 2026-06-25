import Link from "next/link"
import type { ReactNode } from "react"
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
  resolveMarket,
  marketLabel,
  ALL_MARKETS,
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

// Systems-diagram node — a labeled technical panel
function DiagramNode({ label, title, accent, children }: { label: string; title: string; accent?: boolean; children: ReactNode }) {
  return (
    <div className={`relative flex flex-col rounded-lg border-2 p-5 ${accent ? "border-[#f9cb16] bg-[#f9cb16]/[0.06]" : "border-white/20 bg-black/40"}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</span>
      <h3 className="mt-1 font-cal text-lg">{title}</h3>
      <div className="mt-3 flex-1">{children}</div>
    </div>
  )
}

// Flow connector — horizontal on desktop, vertical on mobile
function Connector() {
  return (
    <div className="flex items-center justify-center py-1 lg:py-0">
      <ArrowRight className="h-6 w-6 rotate-90 text-gray-600 lg:rotate-0" />
    </div>
  )
}

export default async function Home({ searchParams }: { searchParams: Promise<{ market?: string }> }) {
  const market = resolveMarket((await searchParams).market)
  const isAll = market === ALL_MARKETS
  const label = marketLabel(market)
  const s = marketStats(market)
  const webLeads = webUpgradeLeads(market)
  const talent = talentLeads(market)
  const liveOpening = talent.find((t) => t.hiring.confirmedOpening)
  const bands: Band[] = ["A", "B", "C", "D", "F"]
  const maxBand = Math.max(...bands.map((b) => s.bandCounts[b] || 0), 1)

  return (
    <div className="flex min-h-screen flex-col">
      {/* HERO — full viewport, marquee pinned above the fold */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col bg-[#1f1f1f] text-white">
        <div className="flex flex-1 items-center">
          <div className="mx-auto grid w-full max-w-7xl 2xl:max-w-[110rem] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:gap-12 lg:px-10">
            {/* Left */}
            <div className="flex flex-col justify-center">
              <Badge className="mb-5 inline-flex w-fit items-center gap-1.5 bg-[#f9cb16] text-black hover:bg-[#f9cb16] 2xl:mb-8 2xl:text-sm">
                <MapPin className="h-3 w-3" /> {isAll ? "Global" : label} · live coworking intelligence
              </Badge>
              <h1 className="font-cal text-5xl leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl 2xl:text-8xl">
                Find the space.
                <br />
                Score the market.
                <br />
                <span className="text-[#f9cb16]">Hire the crew.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-gray-300 2xl:max-w-2xl 2xl:text-2xl">
                {s.total} real spaces. {s.scored} live website scans. Two lead pipelines hiding in one map.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row 2xl:mt-12 2xl:gap-4">
                <Link
                  href="/intelligence"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#f9cb16] px-7 text-sm font-bold text-black border-2 border-[#f9cb16] transition-all hover:bg-[#ffd83a] 2xl:h-14 2xl:px-9 2xl:text-base"
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
              <div className="w-full max-w-md rounded-xl border-2 border-white/15 bg-black/40 p-6 shadow-[8px_8px_0px_0px_rgba(249,203,22,0.25)] 2xl:max-w-xl 2xl:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-cal text-lg 2xl:text-2xl">Live scan</span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400 2xl:text-sm">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    {GENERATED_AT}
                  </span>
                </div>
                <div className="mt-5 space-y-2.5 2xl:mt-8 2xl:space-y-5">
                  {bands.map((b) => {
                    const count = s.bandCounts[b] || 0
                    const c = bandColor(b)
                    return (
                      <div key={b} className="flex items-center gap-3">
                        <span className="w-4 font-cal text-sm text-gray-300 2xl:w-6 2xl:text-lg">{b}</span>
                        <div className="h-5 flex-1 overflow-hidden rounded bg-white/5 2xl:h-8">
                          <div
                            className={`h-full ${c.bg}`}
                            style={{ width: `${Math.max((count / maxBand) * 100, count ? 6 : 0)}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-sm font-medium text-gray-200 2xl:text-lg">{count}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center 2xl:mt-9 2xl:pt-8">
                  <div>
                    <div className="font-cal text-2xl 2xl:text-4xl text-[#f9cb16]">{s.avgScore}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Avg score</div>
                  </div>
                  <div>
                    <div className="font-cal text-2xl 2xl:text-4xl text-orange-400">{s.webUpgradeCount}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Web leads</div>
                  </div>
                  <div>
                    <div className="font-cal text-2xl 2xl:text-4xl text-emerald-400">{s.talentCount}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Talent leads</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SignalMarquee market={market} />
      </section>

      {/* STAT BAND */}
      <section className="border-b-2 border-black bg-[#f9cb16]">
        <div className="mx-auto grid max-w-7xl 2xl:max-w-[110rem] grid-cols-2 divide-x-2 divide-black/10 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-10">
          {[
            { n: s.total, l: "spaces mapped" },
            isAll
              ? { n: s.marketCount, l: "markets" }
              : { n: s.cities.length, l: s.cities.length === 1 ? "city" : "cities" },
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
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-cal text-3xl tracking-tight sm:text-4xl">{isAll ? "The strongest web presence" : `${label}'s strongest web presence`}</h2>
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
            <FeaturedSpaces market={market} />
          </div>
        </div>
      </section>

      {/* SYSTEMS DIAGRAM — one scan, two pipelines */}
      <section className="relative overflow-hidden border-y-2 border-black bg-[#161616] py-16 text-white md:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />
        <div className="relative mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#f9cb16]">how it works</span>
          <h2 className="mt-2 font-cal text-4xl tracking-tight sm:text-5xl">One scan. Two pipelines.</h2>
          <p className="mt-3 max-w-2xl text-gray-400">
            One pass over the market becomes two lists someone can act on today — no human triage in between.
          </p>

          <div className="mt-12 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1.15fr_auto_1.3fr]">
            {/* INPUT */}
            <DiagramNode label="01 · input" title="The market">
              <div className="font-cal text-4xl text-white">{s.total}</div>
              <p className="mt-1 text-sm text-gray-400">
                coworking spaces — every live website + careers page, {isAll ? "across every market" : label}.
              </p>
            </DiagramNode>

            <Connector />

            {/* ENGINE */}
            <DiagramNode label="02 · engine" title="Scan engine" accent>
              <p className="text-sm text-gray-300">Each site rendered in a real browser, checked on five signals:</p>
              <div className="mt-3 grid gap-1.5 font-mono text-xs text-gray-200">
                {SIGNALS.map((sig) => (
                  <div key={sig.label} className="flex items-center gap-2">
                    <sig.icon className="h-3.5 w-3.5 shrink-0 text-[#f9cb16]" />
                    {sig.label}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-300">+ hiring signals read from careers pages &amp; job boards.</p>
            </DiagramNode>

            <Connector />

            {/* OUTPUTS — the split */}
            <div className="flex flex-col gap-3">
              <Link
                href="/intelligence#web-upgrade"
                className="group flex flex-1 flex-col justify-center rounded-lg border-2 border-orange-400/40 bg-orange-500/[0.08] p-5 transition-colors hover:border-orange-400"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-orange-300">→ web-services · Crush</span>
                  <span className="font-cal text-3xl text-orange-400">{webLeads.length}</span>
                </div>
                <p className="mt-1 text-sm text-gray-300">Weak, broken or missing sites — a build/upgrade pitch.</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-300 group-hover:text-orange-200">
                  see the list <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              <Link
                href="/intelligence#talent"
                className="group flex flex-1 flex-col justify-center rounded-lg border-2 border-[#f9cb16]/40 bg-[#f9cb16]/[0.08] p-5 transition-colors hover:border-[#f9cb16]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#f9cb16]">→ recruitment · Bottle Rocket</span>
                  <span className="font-cal text-3xl text-[#f9cb16]">{talent.length}</span>
                </div>
                <p className="mt-1 text-sm text-gray-300">
                  Operators hiring leadership{liveOpening ? ` — incl. ${liveOpening.name.split("—")[0].trim()} hiring now` : ""}.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#f9cb16] group-hover:text-white">
                  route to recruiter <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1f1f1f] py-16 text-white md:py-20">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 text-center sm:px-6 lg:px-10">
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
