import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export const dynamic = 'force-dynamic'

function loadJson(file: string): any[] {
  const fullPath = path.join(process.cwd(), 'data', 'leads', file)
  if (!fs.existsSync(fullPath)) return []
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
  } catch {
    return []
  }
}

const esc = (v: unknown) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET() {
  const talent = loadJson('talent-requests.json')
  const score = loadJson('score-requests.json')

  const header = 'lead_type,submitted_at,status,space_name,contact_name,email,role,location,timeline,website,notes'
  const rows = [
    ...talent.map((l) =>
      ['talent_request', l.submittedAt, l.status, l.spaceName, l.contactName, l.email, l.role, l.location, l.timeline, '', l.notes]
        .map(esc)
        .join(',')
    ),
    ...score.map((l) =>
      ['score_request', l.submittedAt, l.status, l.spaceName, '', l.email, '', '', '', l.websiteUrl, l.description]
        .map(esc)
        .join(',')
    ),
  ]

  return new NextResponse([header, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="atlas-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
