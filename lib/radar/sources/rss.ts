import { NEWS_FEEDS, NEWS_SIGNAL_PATTERNS, OPERATORS } from '../operators'

export interface NewsItem {
  feedName: string
  title: string
  url: string
  publishedAt?: string
  summary?: string
  /** Roster operators mentioned in the headline/summary, if any */
  operators: string[]
}

const TIMEOUT_MS = 10_000

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function extract(tag: string, xml: string): string | undefined {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return m ? decodeEntities(m[1]) : undefined
}

/** Minimal RSS item parser — avoids an XML dependency for simple feeds */
function parseItems(xml: string): { title: string; link: string; pubDate?: string; description?: string }[] {
  const items: { title: string; link: string; pubDate?: string; description?: string }[] = []
  const matches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
  for (const block of matches) {
    const title = extract('title', block)
    const link = extract('link', block)
    if (!title || !link) continue
    items.push({
      title,
      link,
      pubDate: extract('pubDate', block),
      description: extract('description', block),
    })
  }
  return items
}

function mentionedOperators(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `
  return OPERATORS.filter((op) => op.aliases.some((a) => lower.includes(a.toLowerCase()))).map((op) => op.name)
}

/**
 * Fetch industry feeds and keep items that look like expansion /
 * market-entry / leadership-change signals, or that mention a roster
 * operator by name.
 */
export async function fetchNewsSignals(): Promise<{ items: NewsItem[]; feedResults: { feed: string; ok: boolean; kept: number }[] }> {
  const items: NewsItem[] = []
  const feedResults: { feed: string; ok: boolean; kept: number }[] = []

  for (const feed of NEWS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'WorkscapeAtlas-Radar/1.0' },
      })
      if (!res.ok) {
        feedResults.push({ feed: feed.name, ok: false, kept: 0 })
        continue
      }
      const xml = await res.text()
      let kept = 0
      for (const item of parseItems(xml)) {
        const haystack = `${item.title} ${item.description ?? ''}`
        const operators = mentionedOperators(haystack)
        const matchesPattern = NEWS_SIGNAL_PATTERNS.some((p) => p.test(item.title))
        if (!matchesPattern && operators.length === 0) continue
        items.push({
          feedName: feed.name,
          title: item.title,
          url: item.link,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
          summary: item.description?.slice(0, 280),
          operators,
        })
        kept++
      }
      feedResults.push({ feed: feed.name, ok: true, kept })
    } catch {
      feedResults.push({ feed: feed.name, ok: false, kept: 0 })
    }
  }

  return { items, feedResults }
}
