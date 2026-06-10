/**
 * Coworking Industry Radar — scan run.
 *
 * Probes every candidate ATS board in the operator roster (free public
 * JSON endpoints only — zero metered cost), pulls industry news feeds,
 * classifies every posting/headline, and merges the results into
 * data/radar/signals.json with firstSeen/lastSeen/status tracking.
 *
 * Run: npm run radar:scan
 */
import { OPERATORS } from '../lib/radar/operators'
import { ATS_FETCHERS, AtsKind } from '../lib/radar/sources/ats'
import { fetchNewsSignals } from '../lib/radar/sources/rss'
import { classifyRole, classifySeniority } from '../lib/radar/classify'
import { loadSignals, saveSignals, mergeScan, radarDir } from '../lib/radar/store'
import { RadarSignal, ScanSourceResult } from '../lib/radar/types'
import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'

const ID_PREFIX: Record<AtsKind, string> = {
  greenhouse: 'gh',
  lever: 'lever',
  ashby: 'ashby',
  smartrecruiters: 'sr',
  workable: 'workable',
}

async function main() {
  const now = new Date().toISOString()
  const fresh: RadarSignal[] = []
  const sourceResults: ScanSourceResult[] = []
  const succeededBoardPrefixes: string[] = []

  console.log(`Radar scan starting — ${OPERATORS.length} operators\n`)

  for (const operator of OPERATORS) {
    for (const [kind, tokens] of Object.entries(operator.ats) as [AtsKind, string[]][]) {
      for (const token of tokens) {
        const postings = await ATS_FETCHERS[kind](token)
        const board = `${kind}:${token}`
        if (postings === null) {
          sourceResults.push({ board, operator: operator.name, ok: false, count: 0 })
          continue
        }
        succeededBoardPrefixes.push(`${ID_PREFIX[kind]}-${token}-`)
        sourceResults.push({ board, operator: operator.name, ok: true, count: postings.length })
        for (const p of postings) {
          if (!p.title) continue
          fresh.push({
            id: p.externalId,
            type: 'job_posting',
            operator: operator.name,
            title: p.title,
            roleCategory: classifyRole(p.title),
            seniority: classifySeniority(p.title),
            locationRaw: p.locationRaw,
            url: p.url,
            source: board,
            postedAt: p.postedAt,
            firstSeen: now,
            lastSeen: now,
            status: 'active',
          })
        }
        // one board per ATS kind is enough once a token works
        break
      }
    }
  }

  const { items: news, feedResults } = await fetchNewsSignals()
  for (const item of news) {
    fresh.push({
      id: `rss-${createHash('sha1').update(item.url).digest('hex').slice(0, 16)}`,
      type: 'news',
      operator: item.operators[0] ?? item.feedName,
      title: item.title,
      roleCategory: classifyRole(item.title),
      seniority: classifySeniority(item.title),
      locationRaw: '',
      url: item.url,
      source: `rss:${item.feedName}`,
      postedAt: item.publishedAt,
      firstSeen: now,
      lastSeen: now,
      status: 'active',
      summary: item.summary,
    })
  }

  const existing = loadSignals()
  const { merged, added, closed, refreshed } = mergeScan(existing, fresh, succeededBoardPrefixes, now)
  saveSignals(merged)

  const liveBoards = sourceResults.filter((r) => r.ok)
  console.log('— ATS boards —')
  for (const r of sourceResults) {
    console.log(`  ${r.ok ? '✓' : '✗'} ${r.board.padEnd(36)} ${r.operator.padEnd(34)} ${r.ok ? `${r.count} postings` : 'not found'}`)
  }
  console.log('\n— News feeds —')
  for (const f of feedResults) {
    console.log(`  ${f.ok ? '✓' : '✗'} ${f.feed.padEnd(24)} ${f.ok ? `${f.kept} signal items` : 'fetch failed'}`)
  }
  console.log(
    `\nScan complete: ${liveBoards.length} live boards, ${fresh.length} signals fetched → +${added} new, ${refreshed} refreshed, ${closed} closed. Store: ${merged.length} total.`
  )

  fs.writeFileSync(
    path.join(radarDir(), 'last-scan.json'),
    JSON.stringify({ ranAt: now, sourceResults, feedResults, added, refreshed, closed, total: merged.length }, null, 2)
  )
}

main().catch((err) => {
  console.error('Radar scan failed:', err)
  process.exit(1)
})
