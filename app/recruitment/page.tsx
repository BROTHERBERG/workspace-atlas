import Link from "next/link"
import {
  Briefcase,
  ExternalLink,
  CheckCircle2,
  Users,
  Building2,
  ShieldCheck,
  Radar,
  ArrowRight,
  Globe2,
  MapPin,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { talentLeads, marketStats, marketLabel, resolveMarket, ALL_MARKETS, GENERATED_AT } from "@/lib/spaces"
import { loadSignals } from "@/lib/radar/store"

const SENIORITY_LABEL: Record<string, string> = {
  c_suite: "C-suite",
  vp_director: "Director",
  manager: "Manager",
  staff: "Staff",
}
const SENIORITY_RANK: Record<string, number> = { c_suite: 0, vp_director: 1, manager: 2, staff: 3 }

export const metadata = {
  title: "Recruitment — Workscape Atlas",
  description: "Coworking leadership recruitment leads sourced from a live market scan, routed to Bottle Rocket Search.",
}

const ROLES = [
  { title: "Community Manager", note: "The heart of a space — member experience, events, retention." },
  { title: "General Manager", note: "Owns operations, revenue and the on-site team." },
  { title: "Operations Lead", note: "Day-to-day systems, vendors and member support." },
  { title: "Sales / Membership", note: "Fills desks and grows recurring revenue." },
]

export default async function RecruitmentPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>
}) {
  const market = resolveMarket((await searchParams).market)
  const label = marketLabel(market)
  const talent = talentLeads(market)
  const s = marketStats(market)
  const live = talent.filter((t) => t.hiring.confirmedOpening)

  // Global industry Radar — live ATS scan across major operators (Bottle Rocket's targets).
  const allSignals = loadSignals()
  const radarActive = allSignals.filter(
    (sig) => sig.type === "job_posting" && sig.status === "active" && sig.title.trim().toLowerCase() !== "test",
  )
  const radarLeadership = radarActive
    .filter((sig) => sig.seniority === "c_suite" || sig.seniority === "vp_director" || sig.seniority === "manager")
    .sort((a, b) => (SENIORITY_RANK[a.seniority] - SENIORITY_RANK[b.seniority]) || (b.postedAt || "").localeCompare(a.postedAt || ""))
  const radarTop = radarLeadership.slice(0, 9)
  const radarOperators = [...new Set(radarActive.map((sig) => sig.operator))]
  const radarUpdated = allSignals.reduce((max, sig) => (sig.lastSeen > max ? sig.lastSeen : max), "").slice(0, 10)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b-2 border-black bg-[#1f1f1f] text-white">
        <div className="mx-auto grid max-w-7xl 2xl:max-w-[110rem] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-10">
          <div className="flex flex-col justify-center">
            <Badge className="mb-4 inline-flex w-fit items-center gap-1.5 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
              <Radar className="h-3 w-3" /> Sourced from the {market === ALL_MARKETS ? "live market" : label} scan
            </Badge>
            <h1 className="font-cal text-4xl leading-tight tracking-tight sm:text-5xl 2xl:text-6xl">
              Coworking recruitment,
              <br />
              powered by live signals.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-300 2xl:max-w-2xl 2xl:text-xl">
              Every operator hiring leadership in the market — surfaced automatically and routed to Bottle Rocket Search
              Group.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#leads"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#f9cb16] px-7 text-sm font-bold text-black transition-all hover:bg-[#ffd83a]"
              >
                <Briefcase className="h-4 w-4" /> See live talent leads
              </Link>
              <Link
                href="/intelligence"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border-2 border-white/30 px-7 text-sm font-medium text-white hover:border-white"
              >
                Full market map <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-xl border-2 border-white/15 bg-black/40 p-6 text-center shadow-[8px_8px_0px_0px_rgba(249,203,22,0.25)] 2xl:max-w-md 2xl:p-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-cal text-4xl text-[#f9cb16]">{talent.length}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">Talent leads</div>
                </div>
                <div>
                  <div className="font-cal text-4xl text-emerald-400">{live.length}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">Live openings</div>
                </div>
                <div>
                  <div className="font-cal text-4xl text-white">{s.independents}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">Operators tracked</div>
                </div>
                <div>
                  <div className="font-cal text-4xl text-white">{s.cities.length}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">Cities</div>
                </div>
              </div>
              <p className="mt-5 border-t border-white/10 pt-4 text-xs text-gray-400">
                Scanned {GENERATED_AT}. Re-runs on demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live leads */}
      <section id="leads" className="scroll-mt-20 bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <h2 className="font-cal text-3xl tracking-tight">
            {market === ALL_MARKETS ? "Talent leads in the market right now" : `Talent leads in ${label} right now`}
          </h2>
          <p className="mt-2 max-w-2xl text-gray-500">
            Independent operators showing real hiring signals — a careers page, an open role, or both. Each one is a warm
            intro for a recruiter.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {talent.map((l) => (
              <div
                key={l.id}
                className={`flex flex-col rounded-xl border-2 border-black p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] ${
                  l.hiring.confirmedOpening ? "bg-[#f9cb16]/10" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-cal text-lg leading-tight">{l.name.split("—")[0].trim()}</h3>
                  {l.hiring.confirmedOpening ? (
                    <Badge className="shrink-0 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Live role
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 border-black text-gray-600">
                      Careers page
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {l.operator || "Independent"} · {l.neighborhood || l.city}
                </p>
                {l.hiring.notes && <p className="mt-3 text-sm text-gray-600">{l.hiring.notes}</p>}
                {l.hiring.careersUrl && (
                  <a
                    href={l.hiring.careersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-black hover:text-[#caa406]"
                  >
                    Open careers page <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Radar — live industry openings */}
      <section className="border-y-2 border-black bg-[#1f1f1f] py-16 text-white">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Globe2 className="h-6 w-6 text-[#f9cb16]" />
                <h2 className="font-cal text-3xl tracking-tight">Live leadership openings — the Radar</h2>
                <Badge className="bg-[#f9cb16] text-black hover:bg-[#f9cb16]">Global</Badge>
              </div>
              <p className="mt-2 max-w-2xl text-gray-300">
                The {market === ALL_MARKETS ? "leads" : `${label} leads`} above prove the method. The Radar is the same engine pointed at the whole industry —
                a live scan of {radarActive.length} active openings across {radarOperators.slice(0, 3).join(", ")}
                {radarOperators.length > 3 ? " and more" : ""} — Bottle Rocket's actual placement market.
              </p>
            </div>
            {radarUpdated && (
              <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                refreshed {radarUpdated}
              </span>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {radarTop.map((sig) => (
              <a
                key={sig.id}
                href={sig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border-2 border-white/15 bg-black/30 p-5 transition-colors hover:border-[#f9cb16]/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#f9cb16]">{sig.operator}</span>
                  <span className="rounded border border-white/20 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-gray-300">
                    {SENIORITY_LABEL[sig.seniority] || sig.seniority}
                  </span>
                </div>
                <h3 className="mt-2 font-medium leading-snug">{sig.title}</h3>
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" /> {sig.locationRaw}
                </div>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-gray-200 group-hover:text-[#f9cb16]">
                  View role <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-400">
            {radarLeadership.length} leadership-level roles live now · {radarActive.length} total openings tracked.
            Re-runs on demand (free ATS + industry feeds) and re-points at any market.
          </p>
        </div>
      </section>

      {/* Roles */}
      <section className="border-y-2 border-black bg-white py-16">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <h2 className="font-cal text-3xl tracking-tight">Roles Bottle Rocket places</h2>
          <p className="mt-2 max-w-2xl text-gray-500">
            The leadership seats that make or break a flexible-workspace operator.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <div key={r.title} className="rounded-lg border-2 border-black bg-gray-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Briefcase className="h-6 w-6 text-black" />
                <div className="mt-3 font-cal">{r.title}</div>
                <div className="mt-1 text-sm text-gray-500">{r.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How signals surface */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <h2 className="font-cal text-3xl tracking-tight">How the signals surface</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { icon: Radar, t: "Scan the market", d: "Every operator in the market is located and its website rendered." },
              { icon: ShieldCheck, t: "Read the hiring signals", d: "Careers pages and live postings are detected — never assumed." },
              { icon: Users, t: "Route to the desk", d: "Confirmed openings go straight to a recruiter with the source link attached." },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-black bg-[#f9cb16]/20">
                  <x.icon className="h-5 w-5 text-black" />
                </span>
                <h3 className="mt-4 font-cal text-lg">{x.t}</h3>
                <p className="mt-1 text-sm text-gray-600">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottle Rocket */}
      <section className="bg-[#1f1f1f] py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <div className="rounded-xl border-2 border-[#f9cb16] bg-black/40 p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border-2 border-[#f9cb16] bg-[#f9cb16]/15">
                <Building2 className="h-8 w-8 text-[#f9cb16]" />
              </div>
              <div>
                <h2 className="font-cal text-2xl">Bottle Rocket Search Group</h2>
                <p className="mt-2 max-w-2xl text-gray-300">
                  Specialist recruitment for flexible-workspace operators. Workscape Atlas feeds the top of the funnel —
                  every hiring signal in the market, sourced and verified — so the desk works warm leads, not cold lists.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/request-talent">
                    <Button className="border-2 border-[#f9cb16] bg-[#f9cb16] text-black hover:bg-[#ffd83a]">
                      Request talent for your space
                    </Button>
                  </Link>
                  <Link href="/intelligence#talent">
                    <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                      See the talent pipeline
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
