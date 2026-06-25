// Real Calgary & Alberta coworking dataset — sourced + live-scored 2026-06-21.
// Replaces the old faker generator. Unknown values are null by design (never fabricated).
import dataset from "@/data/spaces.json"

export type Band = "A" | "B" | "C" | "D" | "F" | "?"

export interface DigitalSignals {
  reachable: boolean
  https: boolean | null
  mobileOptimized: boolean | null
  metaDescription: boolean | null
  openGraph: boolean | null
  socialCount: number | null
  socials: string[]
  onlineBooking: boolean | null
  dnsResolves: boolean | null
}

export interface Space {
  id: number
  slug: string
  name: string
  operator: string | null
  isChain: boolean
  city: string
  neighborhood: string | null
  address: string | null
  website: string | null
  phone: string | null
  googleRating: number | null
  googleReviewCount: number | null
  targetMember: string | null
  digital: {
    score: number | null
    band: Band
    confidence: "high" | "low" | null
    gaps: string[]
    signals: DigitalSignals
  }
  hiring: {
    hasCareersPage: boolean
    careersUrl: string | null
    confirmedOpening: boolean
    liveJobBoard: boolean
    notes: string | null
  }
  sources: string[]
  leadWebUpgrade: boolean
  leadTalent: boolean
  featured: boolean
  scannedAt: string
  screenshot: string | null
  lat: number | null
  lng: number | null
  geocodePrecision: "address" | "neighborhood" | "city" | null
}

export interface Methodology {
  enumeration: string
  digitalScore: string
  limits: string
}

const data = dataset as unknown as {
  generatedAt: string
  market: string
  methodology: Methodology
  spaces: Space[]
}

export const GENERATED_AT = data.generatedAt
export const MARKET = data.market
export const METHODOLOGY = data.methodology

export function allSpaces(): Space[] {
  return data.spaces
}

export function getSpace(id: number): Space | undefined {
  return data.spaces.find((s) => s.id === id)
}

export function getSpaceBySlug(slug: string): Space | undefined {
  return data.spaces.find((s) => s.slug === slug)
}

export function featuredSpaces(): Space[] {
  return data.spaces.filter((s) => s.featured)
}

export function calgarySpaces(): Space[] {
  return data.spaces.filter((s) => s.city === "Calgary")
}

// Crush web-services pipeline: spaces with weak / missing / broken web presence.
export function webUpgradeLeads(): Space[] {
  return data.spaces.filter((s) => s.leadWebUpgrade)
}

// Lean Six Search pipeline: independent operators surfacing hiring/talent signals.
export function talentLeads(): Space[] {
  return data.spaces.filter((s) => s.leadTalent)
}

const BAND_ORDER: Band[] = ["A", "B", "C", "D", "F", "?"]

export function sortedByScore(spaces: Space[], dir: "desc" | "asc" = "desc"): Space[] {
  return [...spaces].sort((a, b) => {
    const av = a.digital.score ?? -1
    const bv = b.digital.score ?? -1
    return dir === "desc" ? bv - av : av - bv
  })
}

export interface MarketStats {
  total: number
  calgary: number
  otherAlberta: number
  independents: number
  chains: number
  scored: number
  avgScore: number
  bandCounts: Record<string, number>
  webUpgradeCount: number
  talentCount: number
  liveOpenings: number
  cities: { city: string; count: number }[]
}

export function marketStats(): MarketStats {
  const spaces = data.spaces
  const scored = spaces.filter((s) => typeof s.digital.score === "number")
  const bandCounts: Record<string, number> = {}
  for (const b of BAND_ORDER) bandCounts[b] = 0
  for (const s of spaces) bandCounts[s.digital.band] = (bandCounts[s.digital.band] || 0) + 1
  const cityMap = new Map<string, number>()
  for (const s of spaces) cityMap.set(s.city, (cityMap.get(s.city) || 0) + 1)
  return {
    total: spaces.length,
    calgary: spaces.filter((s) => s.city === "Calgary").length,
    otherAlberta: spaces.filter((s) => s.city !== "Calgary").length,
    independents: spaces.filter((s) => !s.isChain).length,
    chains: spaces.filter((s) => s.isChain).length,
    scored: scored.length,
    avgScore: scored.length
      ? Math.round(scored.reduce((a, s) => a + (s.digital.score || 0), 0) / scored.length)
      : 0,
    bandCounts,
    webUpgradeCount: spaces.filter((s) => s.leadWebUpgrade).length,
    talentCount: spaces.filter((s) => s.leadTalent).length,
    liveOpenings: spaces.filter((s) => s.hiring.confirmedOpening).length,
    cities: [...cityMap.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export function bandColor(band: Band): { text: string; bg: string; ring: string } {
  switch (band) {
    case "A":
      return { text: "text-emerald-600", bg: "bg-emerald-500", ring: "border-emerald-500" }
    case "B":
      return { text: "text-lime-600", bg: "bg-lime-500", ring: "border-lime-500" }
    case "C":
      return { text: "text-[#caa406]", bg: "bg-[#f9cb16]", ring: "border-[#f9cb16]" }
    case "D":
      return { text: "text-orange-600", bg: "bg-orange-500", ring: "border-orange-500" }
    case "F":
      return { text: "text-red-600", bg: "bg-red-500", ring: "border-red-500" }
    default:
      return { text: "text-gray-500", bg: "bg-gray-400", ring: "border-gray-400" }
  }
}
