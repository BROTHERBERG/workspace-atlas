import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'
import { radarDir } from './store'

const SNAPSHOT_DIR = path.join(radarDir(), 'snapshots')
const TIMEOUT_MS = 15_000
const MIN_DOMAIN_INTERVAL_MS = 3_000
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const lastFetchByDomain = new Map<string, number>()

export interface PageSnapshot {
  operatorId: string
  pageKey: string
  url: string
  fetchedAt: string
  hash: string
  normalizedText: string
  rawHtml?: string
  rendered?: boolean
}

export interface FetchErrorRecord {
  operatorId: string
  pageKey: string
  url: string
  fetchedAt: string
  status: 'fetch_error'
  error: string
}

export interface SnapshotDiffBlock {
  text: string
}

export interface SnapshotDiffResult {
  operatorId: string
  pageKey: string
  url: string
  fetchedAt: string
  status: 'baseline' | 'unchanged' | 'changed' | 'fetch_error'
  currentHash: string | null
  previousHash: string | null
  added: SnapshotDiffBlock[]
  removed: SnapshotDiffBlock[]
  snapshotPath?: string
  normalizedText?: string
  rawHtml?: string
  rendered?: boolean
  error?: string
}

export interface SnapshotPageInput {
  operatorId: string
  pageKey: string
  url: string
  render?: boolean
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function snapshotSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function pageDir(operatorId: string, pageKey: string): string {
  return path.join(SNAPSHOT_DIR, snapshotSlug(operatorId), snapshotSlug(pageKey))
}

export function snapshotArtifactsDir(operatorId: string, pageKey: string): string {
  const dir = pageDir(operatorId, pageKey)
  ensureDir(dir)
  return dir
}

function safeSnapshotName(fetchedAt: string): string {
  return `${fetchedAt.replace(/[:.]/g, '-')}.json`
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&#8217;|&#x2019;/gi, "'")
    .replace(/&#8216;|&#x2018;/gi, "'")
    .replace(/&#8220;|&#8221;|&#x201c;|&#x201d;/gi, '"')
    .replace(/&#8211;|&#8212;|&#x2013;|&#x2014;/gi, '-')
}

function stripJsonLd(html: string): string {
  return html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, ' ')
}

function htmlToTextBlocks(html: string): string[] {
  const withoutJunk = stripJsonLd(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\s(?:nonce|integrity|data-[a-z0-9_-]+|aria-describedby|aria-labelledby)=["'][^"']*["']/gi, ' ')
    .replace(/\s(?:id|for)=["'][a-z0-9_-]*(?:session|token|uuid|nonce|hash|timestamp)[^"']*["']/gi, ' ')
    .replace(/<(br|hr)\b[^>]*>/gi, '\n')
    .replace(/<\/(p|div|section|article|main|header|footer|nav|aside|li|h[1-6]|tr|td|th|blockquote|button|a)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  return decodeHtmlEntities(withoutJunk)
    .split(/\n+/)
    .map((block) => normalizeBlock(block))
    .filter((block) => block.length >= 2)
    .filter((block) => !isVolatileBlock(block))
}

function normalizeBlock(block: string): string {
  return block
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, '[phone]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[uuid]')
    .replace(/\b(?:19|20)\d{2}-\d{2}-\d{2}(?:[t\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?z?)?\b/gi, '[date]')
    .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+(?:19|20)\d{2}\b/gi, '[date]')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s?(?:am|pm)?\b/gi, '[time]')
    .replace(/\b(?:session|token|nonce|cache|timestamp|ts|build|version)[_-]?[a-z0-9]{6,}\b/gi, '[volatile]')
    .replace(/\s+/g, ' ')
    .trim()
}

function isVolatileBlock(block: string): boolean {
  const lower = block.toLowerCase()
  if (/^(copyright|©|\(c\))/.test(lower)) return true
  if (/^(last updated|updated|generated|loaded|powered by)/.test(lower)) return true
  if (/^(cookie|cookies|privacy settings|accept all|reject all|manage consent)$/.test(lower)) return true
  if (/^\[date\]$|^\[time\]$|^\[volatile\]$/.test(lower)) return true
  return false
}

export function normalizePageHtml(html: string): string {
  const blocks = htmlToTextBlocks(html)
  const deduped: string[] = []
  const seen = new Set<string>()

  for (const block of blocks) {
    const key = block.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(block)
  }

  return deduped.join('\n\n')
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

function loadLatest(dir: string): PageSnapshot | null {
  const latestPath = path.join(dir, 'latest.json')
  if (!fs.existsSync(latestPath)) return null
  try {
    return JSON.parse(fs.readFileSync(latestPath, 'utf-8')) as PageSnapshot
  } catch {
    return null
  }
}

function storeSnapshot(snapshot: PageSnapshot): string {
  const dir = pageDir(snapshot.operatorId, snapshot.pageKey)
  ensureDir(dir)
  const filename = safeSnapshotName(snapshot.fetchedAt)
  const snapshotPath = path.join(dir, filename)
  const serialized = JSON.stringify(snapshot, null, 2)

  fs.writeFileSync(snapshotPath, serialized)
  fs.writeFileSync(path.join(dir, 'latest.json'), serialized)

  return snapshotPath
}

function storeFetchError(error: FetchErrorRecord): void {
  const dir = pageDir(error.operatorId, error.pageKey)
  ensureDir(dir)
  fs.writeFileSync(path.join(dir, `fetch-error-${safeSnapshotName(error.fetchedAt)}`), JSON.stringify(error, null, 2))
}

async function waitForDomain(url: string): Promise<void> {
  const domain = new URL(url).hostname.toLowerCase()
  const lastFetch = lastFetchByDomain.get(domain)
  const now = Date.now()

  if (lastFetch && now - lastFetch < MIN_DOMAIN_INTERVAL_MS) {
    await sleep(MIN_DOMAIN_INTERVAL_MS - (now - lastFetch))
  }

  lastFetchByDomain.set(domain, Date.now())
}

export async function fetchStaticPage(url: string): Promise<string> {
  await waitForDomain(url)
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': USER_AGENT,
    },
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

async function renderPage(url: string): Promise<string> {
  await waitForDomain(url)
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ userAgent: USER_AGENT })
    await page.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT_MS })
    return await page.content()
  } finally {
    await browser.close()
  }
}

function diffBlocks(previousText: string, currentText: string): { added: SnapshotDiffBlock[]; removed: SnapshotDiffBlock[] } {
  const previous = previousText.split(/\n{2,}/).filter(Boolean)
  const current = currentText.split(/\n{2,}/).filter(Boolean)
  const rows = previous.length + 1
  const cols = current.length + 1
  const lcs = Array.from({ length: rows }, () => Array<number>(cols).fill(0))

  for (let i = previous.length - 1; i >= 0; i--) {
    for (let j = current.length - 1; j >= 0; j--) {
      lcs[i][j] = previous[i] === current[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const added: SnapshotDiffBlock[] = []
  const removed: SnapshotDiffBlock[] = []
  let i = 0
  let j = 0

  while (i < previous.length && j < current.length) {
    if (previous[i] === current[j]) {
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      removed.push({ text: previous[i] })
      i++
    } else {
      added.push({ text: current[j] })
      j++
    }
  }

  while (i < previous.length) removed.push({ text: previous[i++] })
  while (j < current.length) added.push({ text: current[j++] })

  return { added, removed }
}

export async function snapshotPage(input: SnapshotPageInput): Promise<SnapshotDiffResult> {
  const fetchedAt = new Date().toISOString()
  const dir = pageDir(input.operatorId, input.pageKey)
  const previous = loadLatest(dir)

  try {
    const html = input.render ? await renderPage(input.url) : await fetchStaticPage(input.url)
    const normalizedText = normalizePageHtml(html)
    const currentHash = hashText(normalizedText)
    const snapshot: PageSnapshot = {
      operatorId: input.operatorId,
      pageKey: input.pageKey,
      url: input.url,
      fetchedAt,
      hash: currentHash,
      normalizedText,
      rawHtml: html,
      rendered: Boolean(input.render),
    }
    const snapshotPath = storeSnapshot(snapshot)

    if (!previous) {
      return {
        operatorId: input.operatorId,
        pageKey: input.pageKey,
        url: input.url,
        fetchedAt,
        status: 'baseline',
        currentHash,
        previousHash: null,
        added: [],
        removed: [],
        snapshotPath,
        normalizedText,
        rawHtml: html,
        rendered: Boolean(input.render),
      }
    }

    if (previous.hash === currentHash) {
      return {
        operatorId: input.operatorId,
        pageKey: input.pageKey,
        url: input.url,
        fetchedAt,
        status: 'unchanged',
        currentHash,
        previousHash: previous.hash,
        added: [],
        removed: [],
        snapshotPath,
        normalizedText,
        rawHtml: html,
        rendered: Boolean(input.render),
      }
    }

    const diff = diffBlocks(previous.normalizedText, normalizedText)
    return {
      operatorId: input.operatorId,
      pageKey: input.pageKey,
      url: input.url,
      fetchedAt,
      status: 'changed',
      currentHash,
      previousHash: previous.hash,
      ...diff,
      snapshotPath,
      normalizedText,
      rawHtml: html,
      rendered: Boolean(input.render),
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    storeFetchError({
      operatorId: input.operatorId,
      pageKey: input.pageKey,
      url: input.url,
      fetchedAt,
      status: 'fetch_error',
      error,
    })
    return {
      operatorId: input.operatorId,
      pageKey: input.pageKey,
      url: input.url,
      fetchedAt,
      status: 'fetch_error',
      currentHash: null,
      previousHash: previous?.hash ?? null,
      added: [],
      removed: [],
      error,
    }
  }
}
