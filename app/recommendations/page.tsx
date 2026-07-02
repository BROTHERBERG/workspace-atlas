import Link from "next/link"
import { Sparkles, TrendingUp, Wand2, Briefcase, ArrowRight, Radar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import SpaceCard from "@/components/space-card"
import {
  sortedByScore,
  allSpaces,
  webUpgradeLeads,
  talentLeads,
  resolveMarket,
  marketLabel,
  GENERATED_AT,
  type Space,
} from "@/lib/spaces"

export const metadata = {
  title: "Recommended spaces — Workscape Atlas",
  description: "Standout coworking spaces from the live market scan.",
}

function Section({
  icon: Icon,
  title,
  blurb,
  spaces,
  accent,
}: {
  icon: typeof TrendingUp
  title: string
  blurb: string
  spaces: Space[]
  accent: string
}) {
  if (!spaces.length) return null
  return (
    <section className="mx-auto max-w-7xl 2xl:max-w-[min(93vw,150rem)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-md border-2 border-black ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-cal text-2xl tracking-tight">{title}</h2>
          <p className="text-sm text-gray-500">{blurb}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-[2000px]:grid-cols-4">
        {spaces.map((s) => (
          <SpaceCard key={s.id} space={s} />
        ))}
      </div>
    </section>
  )
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>
}) {
  const market = resolveMarket((await searchParams).market)
  const topScored = sortedByScore(
    allSpaces(market).filter((s) => !s.isChain && (s.digital.score ?? 0) >= 88),
  ).slice(0, 6)
  const webLeads = webUpgradeLeads(market).slice(0, 6)
  const talent = talentLeads(market)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b-2 border-black bg-[#1f1f1f] text-white">
        <div className="mx-auto max-w-7xl 2xl:max-w-[min(93vw,150rem)] px-4 py-14 sm:px-6 lg:px-10">
          <Badge className="mb-4 inline-flex items-center gap-1.5 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
            <Radar className="h-3 w-3" /> {marketLabel(market)} · scanned {GENERATED_AT}
          </Badge>
          <h1 className="flex items-center gap-2 font-cal text-3xl tracking-tight sm:text-4xl">
            <Sparkles className="h-7 w-7 text-[#f9cb16]" /> Recommended spaces
          </h1>
          <p className="mt-3 max-w-2xl text-gray-300">
            Standouts pulled live from the market scan — the best-run sites, the operators worth a web-services call, and
            the ones hiring leadership right now.
          </p>
        </div>
      </div>

      <Section
        icon={TrendingUp}
        title="Best digital presence"
        blurb="Independent operators setting the bar — scored 88+ on live web signals."
        spaces={topScored}
        accent="bg-emerald-100 text-emerald-600"
      />
      <Section
        icon={Wand2}
        title="Worth a web-services call"
        blurb="Weak, broken, or missing websites → a Crush Digital opportunity."
        spaces={webLeads}
        accent="bg-orange-100 text-orange-600"
      />
      <Section
        icon={Briefcase}
        title="Hiring leadership"
        blurb="Operators surfacing hiring signals → routed to Bottle Rocket Search."
        spaces={talent}
        accent="bg-[#f9cb16]/20 text-[#caa406]"
      />

      <div className="mx-auto max-w-7xl 2xl:max-w-[min(93vw,150rem)] px-4 pb-16 sm:px-6 lg:px-10">
        <div className="rounded-xl border-2 border-black bg-white p-6 text-center shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-gray-700">Want the full picture — every space, every lead, the methodology?</p>
          <Link
            href="/intelligence"
            className="mt-3 inline-flex items-center gap-1.5 font-semibold text-black underline hover:text-[#caa406]"
          >
            Open the intelligence map <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
