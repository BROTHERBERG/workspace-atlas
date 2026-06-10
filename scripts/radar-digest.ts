/**
 * Coworking Industry Radar — weekly digest generator.
 *
 * Reads data/radar/signals.json and writes a recruiter-ready digest
 * (markdown + CSV) to data/radar/digests/.
 *
 * Run: npm run radar:digest
 */
import { loadSignals, radarDir } from '../lib/radar/store'
import { daysOpen } from '../lib/radar/classify'
import { RadarSignal } from '../lib/radar/types'
import * as fs from 'fs'
import * as path from 'path'

const STALE_DAYS = 45
const NEW_DAYS = 7

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function mdRow(cells: string[]): string {
  return `| ${cells.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |`
}

function jobLine(s: RadarSignal): string[] {
  return [`[${s.title}](${s.url})`, s.operator, s.locationRaw || '—', `${daysOpen(s.firstSeen)}d`, s.seniority.replace('_', '/')]
}

function main() {
  const signals = loadSignals()
  const now = new Date()
  const stamp = now.toISOString().slice(0, 10)

  const activeJobs = signals.filter((s) => s.type === 'job_posting' && s.status === 'active')
  const leadership = activeJobs.filter((s) => s.seniority === 'c_suite' || s.seniority === 'vp_director')
  const gmCommunity = activeJobs.filter((s) => s.roleCategory === 'general_management' || s.roleCategory === 'community')
  const newThisWeek = activeJobs.filter((s) => daysOpen(s.firstSeen, now) <= NEW_DAYS)
  const stale = activeJobs.filter((s) => daysOpen(s.firstSeen, now) >= STALE_DAYS)
  const news = signals
    .filter((s) => s.type === 'news')
    .sort((a, b) => (b.postedAt ?? b.firstSeen).localeCompare(a.postedAt ?? a.firstSeen))
    .slice(0, 25)

  const operators = Array.from(new Set(activeJobs.map((s) => s.operator))).sort()

  const lines: string[] = []
  lines.push(`# Coworking Industry Radar — Weekly Digest`)
  lines.push(``)
  lines.push(`**${stamp}** · ${activeJobs.length} active openings across ${operators.length} operators · ${leadership.length} leadership roles · ${newThisWeek.length} new this week · ${stale.length} open ${STALE_DAYS}+ days`)
  lines.push(``)

  lines.push(`## Leadership openings (C-suite / VP / Director / Head of)`)
  lines.push(``)
  if (leadership.length === 0) {
    lines.push(`_None active._`)
  } else {
    lines.push(mdRow(['Role', 'Operator', 'Location', 'Open', 'Level']))
    lines.push(mdRow(['---', '---', '---', '---', '---']))
    for (const s of leadership.sort((a, b) => daysOpen(b.firstSeen, now) - daysOpen(a.firstSeen, now))) {
      lines.push(mdRow(jobLine(s)))
    }
  }
  lines.push(``)

  lines.push(`## Hard-to-fill (open ${STALE_DAYS}+ days) — warm BD targets`)
  lines.push(``)
  if (stale.length === 0) {
    lines.push(`_None yet — tracking begins from first scan date._`)
  } else {
    lines.push(mdRow(['Role', 'Operator', 'Location', 'Open', 'Level']))
    lines.push(mdRow(['---', '---', '---', '---', '---']))
    for (const s of stale.sort((a, b) => daysOpen(b.firstSeen, now) - daysOpen(a.firstSeen, now))) {
      lines.push(mdRow(jobLine(s)))
    }
  }
  lines.push(``)

  lines.push(`## GM & Community roles`)
  lines.push(``)
  if (gmCommunity.length === 0) {
    lines.push(`_None active._`)
  } else {
    lines.push(mdRow(['Role', 'Operator', 'Location', 'Open', 'Level']))
    lines.push(mdRow(['---', '---', '---', '---', '---']))
    for (const s of gmCommunity) lines.push(mdRow(jobLine(s)))
  }
  lines.push(``)

  lines.push(`## Openings by operator`)
  lines.push(``)
  for (const op of operators) {
    const jobs = activeJobs.filter((s) => s.operator === op)
    lines.push(`- **${op}** — ${jobs.length} open role${jobs.length === 1 ? '' : 's'}`)
  }
  lines.push(``)

  lines.push(`## Expansion & industry news`)
  lines.push(``)
  if (news.length === 0) {
    lines.push(`_No news signals captured yet._`)
  } else {
    for (const s of news) {
      const date = (s.postedAt ?? s.firstSeen).slice(0, 10)
      lines.push(`- ${date} — [${s.title}](${s.url})${s.operator && !s.source.includes(s.operator) ? ` _(${s.operator})_` : ''}`)
    }
  }
  lines.push(``)

  const digestsDir = path.join(radarDir(), 'digests')
  if (!fs.existsSync(digestsDir)) fs.mkdirSync(digestsDir, { recursive: true })

  const mdPath = path.join(digestsDir, `digest-${stamp}.md`)
  fs.writeFileSync(mdPath, lines.join('\n'))

  const csvHeader = ['type', 'operator', 'title', 'category', 'seniority', 'location', 'days_open', 'status', 'url']
  const csvRows = signals
    .filter((s) => s.status === 'active')
    .map((s) =>
      [s.type, s.operator, s.title, s.roleCategory, s.seniority, s.locationRaw, String(daysOpen(s.firstSeen, now)), s.status, s.url]
        .map(csvEscape)
        .join(',')
    )
  const csvPath = path.join(digestsDir, `digest-${stamp}.csv`)
  fs.writeFileSync(csvPath, [csvHeader.join(','), ...csvRows].join('\n'))

  console.log(`Digest written:\n  ${mdPath}\n  ${csvPath}`)
  console.log(`${activeJobs.length} active openings · ${leadership.length} leadership · ${stale.length} hard-to-fill · ${news.length} news items`)
}

main()
