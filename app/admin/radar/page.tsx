import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Radar, Download, Newspaper, Briefcase } from 'lucide-react'
import { loadSignals } from '@/lib/radar/store'
import { daysOpen } from '@/lib/radar/classify'
import { RoleCategory, Seniority } from '@/lib/radar/types'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  executive: 'Executive',
  general_management: 'General Management',
  community: 'Community',
  sales: 'Sales',
  operations: 'Operations',
  marketing: 'Marketing',
  finance: 'Finance',
  people: 'People',
  tech: 'Tech',
  other: 'Other',
}

const SENIORITY_LABELS: Record<string, string> = {
  c_suite: 'C-Suite',
  vp_director: 'VP / Director',
  manager: 'Manager',
  staff: 'Staff',
}

interface RadarPageProps {
  searchParams: Promise<{ category?: string; seniority?: string; operator?: string; view?: string }>
}

export default async function AdminRadarPage({ searchParams }: RadarPageProps) {
  const { category, seniority, operator, view } = await searchParams
  const allSignals = loadSignals()
  const now = new Date()

  const activeJobs = allSignals.filter((s) => s.type === 'job_posting' && s.status === 'active')
  const news = allSignals
    .filter((s) => s.type === 'news')
    .sort((a, b) => (b.postedAt ?? b.firstSeen).localeCompare(a.postedAt ?? a.firstSeen))

  const leadership = activeJobs.filter((s) => s.seniority === 'c_suite' || s.seniority === 'vp_director')
  const newThisWeek = activeJobs.filter((s) => daysOpen(s.firstSeen, now) <= 7)
  const stale = activeJobs.filter((s) => daysOpen(s.firstSeen, now) >= 45)
  const operators = Array.from(new Set(activeJobs.map((s) => s.operator))).sort()

  let rows = activeJobs
  if (category) rows = rows.filter((s) => s.roleCategory === (category as RoleCategory))
  if (seniority) rows = rows.filter((s) => s.seniority === (seniority as Seniority))
  if (operator) rows = rows.filter((s) => s.operator === operator)
  rows = rows.sort((a, b) => daysOpen(b.firstSeen, now) - daysOpen(a.firstSeen, now))

  const filterHref = (next: { category?: string; seniority?: string; operator?: string }) => {
    const params = new URLSearchParams()
    const merged = { category, seniority, operator, ...next }
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v)
    const qs = params.toString()
    return `/admin/radar${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-cal mb-2 flex items-center gap-3 text-4xl">
              <Radar className="h-9 w-9 text-[#f9cb16]" />
              Industry Radar
            </h1>
            <p className="text-gray-400">
              Live hiring &amp; expansion signals across the coworking industry — scanned from public job boards and industry press.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-[#f9cb16] text-black hover:bg-yellow-400">
              <a href="/api/radar?format=csv">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: 'Active openings', value: activeJobs.length, accent: 'text-white' },
            { label: 'Leadership roles', value: leadership.length, accent: 'text-[#f9cb16]' },
            { label: 'Operators tracked', value: operators.length, accent: 'text-white' },
            { label: 'New this week', value: newThisWeek.length, accent: 'text-green-400' },
            { label: 'Open 45+ days', value: stale.length, accent: 'text-red-400' },
          ].map((stat) => (
            <Card key={stat.label} className="border-2 border-gray-800 bg-black">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-gray-400">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.accent}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {allSignals.length === 0 && (
          <Card className="border-2 border-gray-800 bg-black">
            <CardContent className="py-12 text-center text-gray-400">
              No signals yet. Run <code className="rounded bg-gray-900 px-2 py-1 text-[#f9cb16]">npm run radar:scan</code> to populate the radar.
            </CardContent>
          </Card>
        )}

        {allSignals.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Job signals */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#f9cb16]" />
                <h2 className="font-cal text-2xl">Open roles{rows.length !== activeJobs.length ? ` (${rows.length} filtered)` : ` (${rows.length})`}</h2>
              </div>

              {/* Filters */}
              <div className="mb-4 flex flex-wrap gap-2 text-sm">
                <Link href="/admin/radar" className={`rounded-full border px-3 py-1 ${!category && !seniority && !operator ? 'border-[#f9cb16] text-[#f9cb16]' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  All
                </Link>
                {Object.entries(SENIORITY_LABELS).map(([key, label]) => (
                  <Link key={key} href={filterHref({ seniority: seniority === key ? '' : key })} className={`rounded-full border px-3 py-1 ${seniority === key ? 'border-[#f9cb16] text-[#f9cb16]' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    {label}
                  </Link>
                ))}
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <Link key={key} href={filterHref({ category: category === key ? '' : key })} className={`rounded-full border px-3 py-1 ${category === key ? 'border-[#f9cb16] text-[#f9cb16]' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    {label}
                  </Link>
                ))}
              </div>

              <div className="space-y-3">
                {rows.map((signal) => {
                  const open = daysOpen(signal.firstSeen, now)
                  return (
                    <Card key={signal.id} className="border-2 border-gray-800 bg-black transition-colors hover:border-[#f9cb16]">
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <a href={signal.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-white hover:text-[#f9cb16]">
                            <span className="truncate">{signal.title}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                          </a>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-400">
                            <Link href={filterHref({ operator: operator === signal.operator ? '' : signal.operator })} className="font-medium text-gray-300 hover:text-[#f9cb16]">
                              {signal.operator}
                            </Link>
                            {signal.locationRaw && <span>· {signal.locationRaw}</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge variant="outline" className={signal.seniority === 'c_suite' || signal.seniority === 'vp_director' ? 'border-[#f9cb16] text-[#f9cb16]' : 'border-gray-700 text-gray-400'}>
                            {SENIORITY_LABELS[signal.seniority]}
                          </Badge>
                          <span className={`text-xs ${open >= 45 ? 'text-red-400' : open <= 7 ? 'text-green-400' : 'text-gray-500'}`}>
                            {open >= 45 ? `open ${open}d — hard to fill` : open <= 7 ? `new · ${open}d` : `open ${open}d`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {rows.length === 0 && (
                  <Card className="border-2 border-gray-800 bg-black">
                    <CardContent className="py-8 text-center text-gray-400">No roles match this filter.</CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* News rail */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-[#f9cb16]" />
                <h2 className="font-cal text-2xl">Expansion &amp; industry news</h2>
              </div>
              <div className="space-y-3">
                {news.slice(0, 20).map((item) => (
                  <Card key={item.id} className="border-2 border-gray-800 bg-black transition-colors hover:border-[#f9cb16]">
                    <CardContent className="p-4">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-[#f9cb16]">
                        {item.title}
                      </a>
                      <div className="mt-1 text-xs text-gray-500">
                        {(item.postedAt ?? item.firstSeen).slice(0, 10)} · {item.source.replace('rss:', '')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {news.length === 0 && (
                  <Card className="border-2 border-gray-800 bg-black">
                    <CardContent className="py-8 text-center text-gray-400">No news signals yet.</CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
