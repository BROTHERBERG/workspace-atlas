import { NextRequest, NextResponse } from 'next/server'
import { loadSignals } from '@/lib/radar/store'
import { daysOpen } from '@/lib/radar/classify'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const type = params.get('type')
  const operator = params.get('operator')
  const category = params.get('category')
  const seniority = params.get('seniority')
  const status = params.get('status') ?? 'active'
  const format = params.get('format')

  let signals = loadSignals()

  if (status !== 'all') signals = signals.filter((s) => s.status === status)
  if (type) signals = signals.filter((s) => s.type === type)
  if (operator) signals = signals.filter((s) => s.operator === operator)
  if (category) signals = signals.filter((s) => s.roleCategory === category)
  if (seniority) signals = signals.filter((s) => s.seniority === seniority)

  signals.sort((a, b) => (b.postedAt ?? b.firstSeen).localeCompare(a.postedAt ?? a.firstSeen))

  if (format === 'csv') {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
    const header = 'type,operator,title,category,seniority,location,days_open,status,url'
    const rows = signals.map((s) =>
      [s.type, s.operator, s.title, s.roleCategory, s.seniority, s.locationRaw, String(daysOpen(s.firstSeen)), s.status, s.url]
        .map(esc)
        .join(',')
    )
    return new NextResponse([header, ...rows].join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="radar-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  return NextResponse.json({
    count: signals.length,
    signals: signals.map((s) => ({ ...s, daysOpen: daysOpen(s.firstSeen) })),
  })
}
