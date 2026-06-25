"use client"

import { Suspense, useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, X, Wand2, Briefcase, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SpaceCard from "@/components/space-card"
import { allSpaces, marketStats, marketLabel, resolveMarket, sortedByScore, ALL_MARKETS } from "@/lib/spaces"

const SPACES = allSpaces()

type LeadFilter = "all" | "web" | "talent"

function SearchInner() {
  const params = useSearchParams()
  const market = resolveMarket(params.get("market"))
  const stats = marketStats(market)
  const [q, setQ] = useState("")
  const [city, setCity] = useState("all")
  const [lead, setLead] = useState<LeadFilter>("all")

  useEffect(() => {
    const initial = params.get("q") || ""
    if (initial) setQ(initial)
  }, [params])

  const results = useMemo(() => {
    const list = SPACES.filter((s) => {
      if (market !== ALL_MARKETS && s.market !== market) return false
      if (city !== "all" && s.city !== city) return false
      if (lead === "web" && !s.leadWebUpgrade) return false
      if (lead === "talent" && !s.leadTalent) return false
      if (q.trim()) {
        const hay = `${s.name} ${s.operator ?? ""} ${s.neighborhood ?? ""} ${s.city} ${s.targetMember ?? ""}`.toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) return false
      }
      return true
    })
    return sortedByScore(list)
  }, [q, city, lead, market])

  const hasQuery = q.trim() || city !== "all" || lead !== "all"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search hero */}
      <div className="border-b-2 border-black bg-[#1f1f1f] text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-10">
          <h1 className="font-cal text-3xl tracking-tight sm:text-4xl">
            {market === ALL_MARKETS
              ? "Search the coworking market"
              : `Search the ${marketLabel(market)} coworking market`}
          </h1>
          <p className="mt-3 text-gray-300">
            {stats.total} real spaces, each scored on its live website. Search by name, operator, or neighborhood.
          </p>
          <div className="mx-auto mt-7 flex max-w-2xl items-center gap-2 rounded-lg bg-white p-2">
            <Search className="ml-1 h-5 w-5 shrink-0 text-gray-500" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Try “Beltline”, “Work Nicer”, “Inglewood”…"
              className="border-0 bg-transparent text-black shadow-none focus-visible:ring-0"
            />
            {q && (
              <button onClick={() => setQ("")} className="mr-1 text-gray-400 hover:text-black" aria-label="Clear">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-9 w-[150px] border-2 border-black bg-white text-black">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {stats.cities.map((c) => (
                  <SelectItem key={c.city} value={c.city}>
                    {c.city} ({c.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setLead(lead === "web" ? "all" : "web")}
              className={`flex h-9 items-center gap-1.5 rounded-md border-2 border-black px-3 text-sm font-medium ${
                lead === "web" ? "bg-orange-500 text-white" : "bg-white text-gray-800"
              }`}
            >
              <Wand2 className="h-4 w-4" /> Web leads
            </button>
            <button
              onClick={() => setLead(lead === "talent" ? "all" : "talent")}
              className={`flex h-9 items-center gap-1.5 rounded-md border-2 border-black px-3 text-sm font-medium ${
                lead === "talent" ? "bg-[#f9cb16] text-black" : "bg-white text-gray-800"
              }`}
            >
              <Briefcase className="h-4 w-4" /> Talent leads
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 py-8 sm:px-6 lg:px-10">
        <p className="mb-6 text-sm font-semibold text-gray-700">
          {hasQuery ? `${results.length} result${results.length === 1 ? "" : "s"}` : `All ${results.length} spaces, ranked by digital score`}
        </p>
        {results.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg font-medium text-gray-700">No spaces match “{q}”.</p>
            <Button onClick={() => { setQ(""); setCity("all"); setLead("all") }} className="mt-4 border-2 border-black bg-[#f9cb16] text-black">
              Clear search
            </Button>
          </div>
        )}
        <p className="mt-10 text-center text-sm text-gray-500">
          Looking for the lead view?{" "}
          <Link href="/intelligence" className="font-semibold text-black underline hover:text-[#caa406]">
            Open the intelligence map <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1f1f1f]" />}>
      <SearchInner />
    </Suspense>
  )
}
