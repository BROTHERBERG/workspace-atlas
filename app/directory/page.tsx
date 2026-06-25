"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, Wand2, Briefcase, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SpaceCard from "@/components/space-card"
import { allSpaces, marketStats } from "@/lib/spaces"

const SPACES = allSpaces()
const STATS = marketStats()

type ScoreFilter = "all" | "strong" | "weak"
type LeadFilter = "all" | "web" | "talent"
type Sort = "score-desc" | "score-asc" | "name"

export default function DirectoryPage() {
  const [q, setQ] = useState("")
  const [city, setCity] = useState("all")
  const [score, setScore] = useState<ScoreFilter>("all")
  const [lead, setLead] = useState<LeadFilter>("all")
  const [sort, setSort] = useState<Sort>("score-desc")

  const results = useMemo(() => {
    let list = SPACES.filter((s) => {
      if (city !== "all" && s.city !== city) return false
      if (score === "strong" && (s.digital.score ?? -1) < 70) return false
      if (score === "weak" && (s.digital.score ?? 101) >= 55) return false
      if (lead === "web" && !s.leadWebUpgrade) return false
      if (lead === "talent" && !s.leadTalent) return false
      if (q.trim()) {
        const hay = `${s.name} ${s.operator ?? ""} ${s.neighborhood ?? ""} ${s.city}`.toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) return false
      }
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name)
      const av = a.digital.score ?? -1
      const bv = b.digital.score ?? -1
      return sort === "score-asc" ? av - bv : bv - av
    })
    return list
  }, [q, city, score, lead, sort])

  const hasFilters = q || city !== "all" || score !== "all" || lead !== "all"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b-2 border-black bg-[#1f1f1f] text-white">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 py-12 sm:px-6 lg:px-10">
          <h1 className="font-cal text-3xl tracking-tight sm:text-4xl md:text-5xl">
            Calgary's coworking market, ranked
          </h1>
          <p className="mt-3 max-w-2xl text-gray-300">
            {STATS.total} real spaces across {STATS.cities.length} Alberta cities — each scored on its live website, not a
            brochure.
          </p>
          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-lg bg-white p-2">
            <Search className="ml-1 h-4 w-4 shrink-0 text-gray-500" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Search by name, operator, or neighborhood…"
              className="border-0 bg-transparent text-black shadow-none focus-visible:ring-0"
            />
            {q && (
              <button onClick={() => setQ("")} className="mr-1 text-gray-400 hover:text-black" aria-label="Clear">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 py-8 sm:px-6 lg:px-10">
        {/* Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
              <SlidersHorizontal className="h-4 w-4" /> Filter
            </span>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-9 w-[150px] border-2 border-black">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {STATS.cities.map((c) => (
                  <SelectItem key={c.city} value={c.city}>
                    {c.city} ({c.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={score} onValueChange={(v) => setScore(v as ScoreFilter)}>
              <SelectTrigger className="h-9 w-[150px] border-2 border-black">
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any score</SelectItem>
                <SelectItem value="strong">Strong (70+)</SelectItem>
                <SelectItem value="weak">Weak (under 55)</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setLead(lead === "web" ? "all" : "web")}
              className={`flex h-9 items-center gap-1.5 rounded-md border-2 border-black px-3 text-sm font-medium transition-colors ${
                lead === "web" ? "bg-orange-500 text-white" : "bg-white text-gray-700 hover:bg-orange-50"
              }`}
            >
              <Wand2 className="h-4 w-4" /> Web leads
            </button>
            <button
              onClick={() => setLead(lead === "talent" ? "all" : "talent")}
              className={`flex h-9 items-center gap-1.5 rounded-md border-2 border-black px-3 text-sm font-medium transition-colors ${
                lead === "talent" ? "bg-[#f9cb16] text-black" : "bg-white text-gray-700 hover:bg-[#f9cb16]/20"
              }`}
            >
              <Briefcase className="h-4 w-4" /> Talent leads
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{results.length} spaces</span>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-9 w-[180px] border-2 border-black">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score-desc">Score: high to low</SelectItem>
                <SelectItem value="score-asc">Score: low to high</SelectItem>
                <SelectItem value="name">Name: A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-lg font-medium text-gray-700">No spaces match those filters.</p>
            {hasFilters && (
              <Button
                onClick={() => {
                  setQ("")
                  setCity("all")
                  setScore("all")
                  setLead("all")
                }}
                className="mt-4 border-2 border-black bg-[#f9cb16] text-black"
              >
                Reset filters
              </Button>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-gray-500">
          Want the lead view instead?{" "}
          <Link href="/intelligence" className="font-semibold text-black underline hover:text-[#caa406]">
            Open the intelligence map
          </Link>
        </p>
      </div>
    </div>
  )
}
