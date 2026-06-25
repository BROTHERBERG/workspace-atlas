import Link from "next/link"
import {
  Radar,
  Wand2,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Share2,
  CalendarCheck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import SpaceMap, { type MapPoint } from "@/components/space-map"
import {
  marketStats,
  webUpgradeLeads,
  talentLeads,
  sortedByScore,
  allSpaces,
  bandColor,
  METHODOLOGY,
  GENERATED_AT,
  MARKET,
  type Band,
  type Space,
} from "@/lib/spaces"

export const metadata = {
  title: "Calgary Coworking Intelligence — Workscape Atlas",
  description: "Every coworking space in Calgary, scored on live web signals and sorted into web-services and recruitment leads.",
}

function SignalDots({ space }: { space: Space }) {
  const g = space.digital.signals
  const items = [
    { ok: g.https, icon: ShieldCheck },
    { ok: g.mobileOptimized, icon: Smartphone },
    { ok: (g.socialCount ?? 0) > 0, icon: Share2 },
    { ok: g.onlineBooking, icon: CalendarCheck },
  ]
  return (
    <div className="flex gap-1">
      {items.map((it, i) => (
        <span
          key={i}
          className={`flex h-5 w-5 items-center justify-center rounded ${
            it.ok ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-300"
          }`}
        >
          <it.icon className="h-3 w-3" />
        </span>
      ))}
    </div>
  )
}

function BandChip({ band, score }: { band: Band; score: number | null }) {
  const c = bandColor(band)
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border-2 border-black px-2 py-0.5 ${c.bg} text-black`}>
      <span className="font-cal text-sm">{band}</span>
      <span className="text-xs font-semibold">{score ?? "—"}</span>
    </span>
  )
}

export default function IntelligencePage() {
  const s = marketStats()
  const webLeads = webUpgradeLeads()
  const talent = talentLeads()
  const ranked = sortedByScore(allSpaces())
  const bands: Band[] = ["A", "B", "C", "D", "F"]
  const mapPoints: MapPoint[] = allSpaces()
    .filter((sp) => typeof sp.lat === "number" && typeof sp.lng === "number")
    .map((sp) => ({
      id: sp.id,
      name: sp.name,
      slug: sp.slug,
      lat: sp.lat as number,
      lng: sp.lng as number,
      band: sp.digital.band,
      score: sp.digital.score,
      web: sp.leadWebUpgrade,
      talent: sp.leadTalent,
      hiringNow: sp.hiring.confirmedOpening,
      neighborhood: sp.neighborhood,
      city: sp.city,
    }))

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="border-b-2 border-black bg-[#1f1f1f] text-white">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 py-14 sm:px-6 lg:px-10">
          <Badge className="mb-4 inline-flex items-center gap-1.5 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
            <Radar className="h-3 w-3" /> {MARKET} · scanned {GENERATED_AT}
          </Badge>
          <h1 className="font-cal text-4xl tracking-tight sm:text-5xl">Calgary Coworking Intelligence</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            One live scan of the local coworking market — every operator located, every website scored, every lead
            sorted into the pipeline that can act on it.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { n: s.total, l: "spaces" },
              { n: s.calgary, l: "Calgary" },
              { n: s.independents, l: "independents" },
              { n: s.avgScore, l: "avg score" },
              { n: s.webUpgradeCount, l: "web leads", c: "text-orange-400" },
              { n: s.talentCount, l: "talent leads", c: "text-[#f9cb16]" },
            ].map((x, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-3 text-center">
                <div className={`font-cal text-2xl ${x.c || "text-white"}`}>{x.n}</div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">{x.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The map */}
      <section className="border-b-2 border-black bg-[#1f1f1f] py-12 text-white">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <h2 className="font-cal text-2xl">The map</h2>
          <p className="mt-2 max-w-2xl text-gray-400">
            Every space, plotted and colored by digital score. Scroll to zoom, click a marker for score + lead status.
          </p>
          <div className="mt-6">
            <SpaceMap points={mapPoints} />
          </div>
        </div>
      </section>

      {/* Market shape */}
      <section className="border-b-2 border-black bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <h2 className="font-cal text-2xl">Where the market sits</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-cal text-lg">Digital presence distribution</h3>
              <div className="mt-4 space-y-3">
                {bands.map((b) => {
                  const count = s.bandCounts[b] || 0
                  const pct = Math.round((count / s.total) * 100)
                  const c = bandColor(b)
                  return (
                    <div key={b} className="flex items-center gap-3">
                      <span className="w-4 font-cal">{b}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded bg-gray-100">
                        <div className={`h-full ${c.bg}`} style={{ width: `${Math.max(pct, count ? 4 : 0)}%` }} />
                      </div>
                      <span className="w-20 text-right text-sm text-gray-600">
                        {count} · {pct}%
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Grade C is dominated by national flex-office chains (Regus / Spaces) running generic location pages — the
                independents are where the strongest and the weakest sites both live.
              </p>
            </div>
            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-cal text-lg">Coverage by city</h3>
              <div className="mt-4 space-y-2">
                {s.cities.map((c) => (
                  <div key={c.city} className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {c.city}
                    </span>
                    <span className="text-sm font-medium">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WEB UPGRADE LEADS */}
      <section id="web-upgrade" className="scroll-mt-20 border-b-2 border-black bg-white py-14">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-black bg-orange-100">
              <Wand2 className="h-6 w-6 text-orange-600" />
            </span>
            <div>
              <h2 className="font-cal text-2xl">Web-services leads · {webLeads.length}</h2>
              <p className="text-sm text-gray-500">Operators with weak, broken, or missing web presence → a Crush Digital pitch.</p>
            </div>
          </div>
          <div className="mt-8 overflow-hidden rounded-xl border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-black bg-orange-50 font-cal">
                <tr>
                  <th className="px-4 py-3">Space</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Area</th>
                  <th className="px-4 py-3">Why it's a lead</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-right">Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {webLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-orange-50/40">
                    <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{l.neighborhood || l.city}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {!l.website
                        ? "No website at all — invisible online"
                        : l.digital.signals.dnsResolves === false
                          ? "Domain no longer resolves — site offline"
                          : (l.digital.gaps[0] || "Thin web presence")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <BandChip band={l.digital.band} score={l.digital.score} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {l.website ? (
                        <a
                          href={l.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-orange-600 hover:underline"
                        >
                          visit <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TALENT LEADS */}
      <section id="talent" className="scroll-mt-20 border-b-2 border-black bg-[#1f1f1f] py-14 text-white">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-[#f9cb16] bg-[#f9cb16]/15">
              <Briefcase className="h-6 w-6 text-[#f9cb16]" />
            </span>
            <div>
              <h2 className="font-cal text-2xl">Recruitment leads · {talent.length}</h2>
              <p className="text-sm text-gray-400">
                Independent operators surfacing hiring signals → routed to Bottle Rocket Search / Lean Six Search.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {talent.map((l) => (
              <div
                key={l.id}
                className={`flex flex-col rounded-xl border-2 p-5 ${
                  l.hiring.confirmedOpening ? "border-[#f9cb16] bg-[#f9cb16]/10" : "border-white/15 bg-black/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-cal text-lg leading-tight">{l.name.split("—")[0].trim()}</h3>
                  {l.hiring.confirmedOpening ? (
                    <Badge className="shrink-0 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Live role
                    </Badge>
                  ) : (
                    <Badge className="shrink-0 border border-white/20 bg-white/5 text-gray-300 hover:bg-white/5">
                      Careers page
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">{l.operator || "Independent"} · {l.neighborhood || l.city}</p>
                {l.hiring.notes && <p className="mt-3 text-sm text-gray-300">{l.hiring.notes}</p>}
                {l.hiring.careersUrl && (
                  <a
                    href={l.hiring.careersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-[#f9cb16] hover:text-white"
                  >
                    Open careers page <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FULL RANKED TABLE */}
      <section className="border-b-2 border-black bg-white py-14">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <h2 className="font-cal text-2xl">The full market, ranked by digital score</h2>
          <p className="mt-2 text-sm text-gray-500">All {s.total} spaces. Green dots = HTTPS · mobile · social · booking.</p>
          <div className="mt-6 overflow-x-auto rounded-xl border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b-2 border-black bg-gray-50 font-cal">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Space</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Signals</th>
                  <th className="px-4 py-3">Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranked.map((space, i) => (
                  <tr key={space.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${bandColor(space.digital.band).bg}`}
                            style={{ width: `${space.digital.score ?? 0}%` }}
                          />
                        </div>
                        <span className="w-7 text-sm font-bold tabular-nums text-gray-800">{space.digital.score ?? "—"}</span>
                        <span className="font-cal text-xs text-gray-400">{space.digital.band}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/spaces/${space.id}`} className="font-medium text-gray-900 hover:text-[#caa406]">
                        {space.name}
                      </Link>
                      <div className="text-xs text-gray-400">{space.operator || "Independent"}</div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{space.neighborhood || space.city}</td>
                    <td className="px-4 py-2.5">
                      <SignalDots space={space} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {space.leadWebUpgrade && <Wand2 className="h-4 w-4 text-orange-500" />}
                        {space.leadTalent && <Briefcase className="h-4 w-4 text-[#caa406]" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* METHODOLOGY */}
      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10">
          <h2 className="flex items-center gap-2 font-cal text-2xl">
            <AlertTriangle className="h-5 w-5 text-[#caa406]" /> How this was built — and its limits
          </h2>
          <dl className="mt-6 space-y-5 text-sm">
            <div>
              <dt className="font-cal text-base">Enumeration</dt>
              <dd className="mt-1 text-gray-600">{METHODOLOGY.enumeration}</dd>
            </div>
            <div>
              <dt className="font-cal text-base">Digital score</dt>
              <dd className="mt-1 text-gray-600">{METHODOLOGY.digitalScore}</dd>
            </div>
            <div>
              <dt className="font-cal text-base">Known limits</dt>
              <dd className="mt-1 text-gray-600">{METHODOLOGY.limits}</dd>
            </div>
          </dl>
          <p className="mt-6 rounded-lg border-2 border-black bg-white p-4 text-sm text-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            This is a real, reproducible scan — not a mockup. Re-running it tomorrow updates every score. Pointed at any
            other market (Sandpoint, Dubai, Edmonton), it produces the same two lead lists.
          </p>
        </div>
      </section>
    </div>
  )
}
