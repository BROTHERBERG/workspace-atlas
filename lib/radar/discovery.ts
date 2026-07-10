import * as fs from 'fs'
import * as path from 'path'
import { OperatorRegistryEntry } from './operators'
import { radarDir } from './store'
import { SnapshotDiffResult, snapshotPage, snapshotSlug } from './snapshot'

export interface DiscoveredUrls {
  teamPageUrl: string | null
  careersUrl: string | null
  discoveredAt: string
}

export type DiscoveryStore = Record<string, DiscoveredUrls>

const DISCOVERY_FILE = path.join(radarDir(), 'discovered-urls.json')

const TEAM_TEXT = /\b(team|leadership|leaders|people|our people|about|about us|who we are)\b/i
const TEAM_URL = /\/(team|leadership|leaders|people|about|about-us|who-we-are)(?:\/|$|\?|#)/i
const CAREERS_TEXT = /\b(careers|jobs|join us|join our team|work with us|open roles|open positions)\b/i
const CAREERS_URL = /\/(careers|jobs|join-us|join-our-team|work-with-us|open-roles|open-positions)(?:\/|$|\?|#)/i
const EXPLICIT_CAREERS_TEXT = /\b(careers|jobs|hiring|join the team|join our team)\b/i
const NON_CAREERS_PATH = /\/[^?#]*(member|pricing|plans|book|tour)[^/?#]*/i

interface LinkCandidate {
  url: string
  text: string
  score: number
}

export function loadDiscoveryStore(): DiscoveryStore {
  if (!fs.existsSync(DISCOVERY_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(DISCOVERY_FILE, 'utf-8')) as DiscoveryStore
  } catch {
    return {}
  }
}

export function saveDiscoveryStore(store: DiscoveryStore): void {
  fs.writeFileSync(DISCOVERY_FILE, JSON.stringify(store, null, 2))
}

export function homepageFromOperator(operator: OperatorRegistryEntry): string | null {
  const domain = operator.domains[0]
  if (!domain) return null
  return `https://${domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}/`
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function sameHost(url: string, base: string): boolean {
  try {
    const candidate = new URL(url)
    const origin = new URL(base)
    return candidate.hostname.replace(/^www\./, '') === origin.hostname.replace(/^www\./, '')
  } catch {
    return false
  }
}

export function isBareRootUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.pathname === '' || parsed.pathname === '/'
  } catch {
    return false
  }
}

function isNonCareersPath(url: string): boolean {
  try {
    return NON_CAREERS_PATH.test(new URL(url).pathname)
  } catch {
    return false
  }
}

function extractLinks(html: string, baseUrl: string, kind: 'team' | 'careers'): LinkCandidate[] {
  const candidates: LinkCandidate[] = []
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  const textPattern = kind === 'team' ? TEAM_TEXT : CAREERS_TEXT
  const urlPattern = kind === 'team' ? TEAM_URL : CAREERS_URL
  let match: RegExpExecArray | null

  while ((match = anchorPattern.exec(html))) {
    const href = decodeEntities(match[1] ?? '').trim()
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue

    let url: string
    try {
      url = new URL(href, baseUrl).toString()
    } catch {
      continue
    }
    if (!sameHost(url, baseUrl)) continue
    if (isBareRootUrl(url)) continue

    const text = stripTags(match[2] ?? '')
    if (kind === 'careers' && isNonCareersPath(url) && !EXPLICIT_CAREERS_TEXT.test(text)) continue

    let score = 0
    if (urlPattern.test(new URL(url).pathname)) score += 3
    if (textPattern.test(text)) score += 4
    if (kind === 'team' && /\bcareers|jobs|locations|contact|blog|events\b/i.test(text)) score -= 3
    if (kind === 'careers' && /\bteam|people|about|locations|contact|blog|events\b/i.test(text)) score -= 2
    if (score <= 0) continue
    candidates.push({ url, text, score })
  }

  return candidates.sort((a, b) => b.score - a.score || a.url.length - b.url.length)
}

export async function discoverOperatorUrls(
  operator: OperatorRegistryEntry,
  options: { force?: boolean; store?: DiscoveryStore } = {}
): Promise<{ urls: DiscoveredUrls; homepageSnapshot?: SnapshotDiffResult }> {
  const operatorId = snapshotSlug(operator.name)
  const store = options.store ?? loadDiscoveryStore()
  const stored = store[operatorId]

  if (stored && !options.force) {
    return { urls: stored }
  }

  const homepage = homepageFromOperator(operator)
  const fallback: DiscoveredUrls = {
    teamPageUrl: null,
    careersUrl: operator.careersUrl,
    discoveredAt: new Date().toISOString(),
  }
  if (!homepage) {
    store[operatorId] = fallback
    saveDiscoveryStore(store)
    return { urls: fallback }
  }

  const homepageSnapshot = await snapshotPage({ operatorId, pageKey: 'homepage-discovery', url: homepage })
  const html = homepageSnapshot.rawHtml ?? ''
  const team = extractLinks(html, homepage, 'team')[0]?.url ?? null
  const registryCareers = operator.careersUrl && !isBareRootUrl(operator.careersUrl) && !isNonCareersPath(operator.careersUrl) ? operator.careersUrl : null
  const careers = registryCareers ?? extractLinks(html, homepage, 'careers')[0]?.url ?? null
  const urls: DiscoveredUrls = { teamPageUrl: team, careersUrl: careers, discoveredAt: new Date().toISOString() }

  store[operatorId] = urls
  saveDiscoveryStore(store)
  return { urls, homepageSnapshot }
}
