import spacesData from '../../data/spaces.json'

/**
 * Operator roster for the Coworking Industry Radar.
 *
 * ATS tokens are CANDIDATES — the scan script probes each one and only
 * keeps boards that respond. A 404 simply means that guess was wrong;
 * successful boards are reported in the scan summary so the roster can
 * be trimmed to verified tokens over time.
 *
 * All endpoints used are free, public, unauthenticated JSON APIs.
 */

export interface OperatorConfig {
  /** Canonical display name */
  name: string
  /** Name fragments used to spot this operator in news headlines */
  aliases: string[]
  ats: {
    greenhouse?: string[]
    lever?: string[]
    ashby?: string[]
    smartrecruiters?: string[]
    workable?: string[]
  }
}

export interface OperatorRegistryEntry {
  /** Canonical display name */
  name: string
  aliases: string[]
  /** Operator domains from repo data; aggregator/listing domains are excluded */
  domains: string[]
  careersUrl: string | null
  teamPageUrl: string | null
  knownAddresses: string[]
  markets: string[]
}

interface SpaceRecord {
  name?: string
  operator?: string
  website?: string | null
  address?: string | null
  market?: string | null
  hiring?: {
    careersUrl?: string | null
  }
}

export const OPERATORS: OperatorConfig[] = [
  {
    name: 'WeWork',
    aliases: ['wework'],
    ats: { smartrecruiters: ['WeWork'], greenhouse: ['wework'] },
  },
  {
    name: 'Industrious',
    aliases: ['industrious'],
    ats: { greenhouse: ['industriousoffice', 'industrious'] },
  },
  {
    name: 'IWG (Regus / Spaces / HQ)',
    aliases: ['iwg', 'regus', 'spaces', 'signature by regus', 'hq global'],
    ats: { smartrecruiters: ['IWG', 'IWGplc'], workable: ['iwg'] },
  },
  {
    name: 'Convene',
    aliases: ['convene', 'etc.venues'],
    ats: { greenhouse: ['convene'] },
  },
  {
    name: 'Mindspace',
    aliases: ['mindspace'],
    ats: { greenhouse: ['mindspace'], lever: ['mindspace'] },
  },
  {
    name: 'JustCo',
    aliases: ['justco'],
    ats: { lever: ['justco'], greenhouse: ['justco'], workable: ['justco'] },
  },
  {
    name: 'The Yard',
    aliases: ['the yard'],
    ats: { greenhouse: ['theyard'], lever: ['theyard'] },
  },
  {
    name: 'Impact Hub',
    aliases: ['impact hub'],
    ats: { greenhouse: ['impacthub'], workable: ['impact-hub'] },
  },
  {
    name: 'Knotel',
    aliases: ['knotel'],
    ats: { greenhouse: ['knotel'] },
  },
  {
    name: 'CIC (Cambridge Innovation Center)',
    aliases: ['cambridge innovation center', 'cic '],
    ats: { greenhouse: ['cic'], lever: ['cic'] },
  },
  {
    name: 'Workbar',
    aliases: ['workbar'],
    ats: { greenhouse: ['workbar'], lever: ['workbar'] },
  },
  {
    name: 'Hub Australia',
    aliases: ['hub australia'],
    ats: { lever: ['hubaustralia'], greenhouse: ['hubaustralia'] },
  },
  {
    name: 'Fora (The Office Group)',
    aliases: ['fora', 'the office group', 'tog'],
    ats: { greenhouse: ['fora', 'theofficegroup'], workable: ['fora'] },
  },
  {
    name: 'Huckletree',
    aliases: ['huckletree'],
    ats: { workable: ['huckletree'], greenhouse: ['huckletree'] },
  },
  {
    name: 'Techspace',
    aliases: ['techspace'],
    ats: { workable: ['techspace'], greenhouse: ['techspace'] },
  },
  {
    name: 'Talent Garden',
    aliases: ['talent garden'],
    ats: { workable: ['talent-garden'], greenhouse: ['talentgarden'] },
  },
  {
    name: 'Serendipity Labs',
    aliases: ['serendipity labs'],
    ats: { greenhouse: ['serendipitylabs'], lever: ['serendipitylabs'] },
  },
  {
    name: 'Premier Workspaces',
    aliases: ['premier workspaces'],
    ats: { greenhouse: ['premierworkspaces'], lever: ['premierworkspaces'] },
  },
  {
    name: 'Venture X',
    aliases: ['venture x'],
    ats: { greenhouse: ['venturex'] },
  },
  {
    name: 'Expansive',
    aliases: ['expansive workspace', 'novel coworking'],
    ats: { greenhouse: ['expansive'], lever: ['expansive'] },
  },
  {
    name: 'Servcorp',
    aliases: ['servcorp'],
    ats: { greenhouse: ['servcorp'], smartrecruiters: ['Servcorp'] },
  },
  {
    name: 'WOTSO',
    aliases: ['wotso'],
    ats: { lever: ['wotso'], greenhouse: ['wotso'] },
  },
]

const AGGREGATOR_DOMAINS = ['coworker.com', 'liquidspace.com', 'deskpass.com', 'sharedesk', 'spacest']

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(values).map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function isAggregatorDomain(domain: string): boolean {
  return AGGREGATOR_DOMAINS.some((aggregator) => domain === aggregator || domain.includes(aggregator))
}

function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '')
    return isAggregatorDomain(domain) ? null : domain
  } catch {
    return null
  }
}

function derivedAliases(name: string): string[] {
  const aliases = new Set<string>()
  const lower = name.toLowerCase().trim()
  aliases.add(lower)

  const withoutParenthetical = lower.replace(/\s*\([^)]*\)/g, '').trim()
  if (withoutParenthetical && withoutParenthetical !== lower) aliases.add(withoutParenthetical)

  for (const part of lower.split('/')) {
    const cleaned = part.replace(/\s*\([^)]*\)/g, '').trim()
    if (cleaned) aliases.add(cleaned)
  }

  return Array.from(aliases)
}

function buildOperatorRegistry(): OperatorRegistryEntry[] {
  const byName = new Map<
    string,
    {
      name: string
      aliases: Set<string>
      domains: string[]
      careersUrls: string[]
      knownAddresses: Set<string>
      markets: Set<string>
    }
  >()

  const spaces = (spacesData as { spaces?: SpaceRecord[] }).spaces ?? []
  for (const space of spaces) {
    const name = (space.operator || space.name || '').trim()
    if (!name) continue

    let entry = byName.get(name)
    if (!entry) {
      entry = {
        name,
        aliases: new Set(derivedAliases(name)),
        domains: [],
        careersUrls: [],
        knownAddresses: new Set(),
        markets: new Set(),
      }
      byName.set(name, entry)
    }

    const domain = domainFromUrl(space.website)
    if (domain && !entry.domains.includes(domain)) entry.domains.push(domain)
    const careersUrl = space.hiring?.careersUrl?.trim()
    if (careersUrl && !entry.careersUrls.includes(careersUrl)) entry.careersUrls.push(careersUrl)
    if (space.address) entry.knownAddresses.add(space.address)
    if (space.market) entry.markets.add(space.market)
  }

  for (const operator of OPERATORS) {
    let entry = byName.get(operator.name)
    if (!entry) {
      entry = {
        name: operator.name,
        aliases: new Set(),
        domains: [],
        careersUrls: [],
        knownAddresses: new Set(),
        markets: new Set(),
      }
      byName.set(operator.name, entry)
    }
    for (const alias of operator.aliases) entry.aliases.add(alias.toLowerCase().trim())
  }

  return Array.from(byName.values())
    .map((entry) => ({
      name: entry.name,
      aliases: uniqueSorted(entry.aliases),
      domains: uniqueSorted(entry.domains),
      careersUrl: entry.careersUrls[0] ?? null,
      teamPageUrl: null,
      knownAddresses: uniqueSorted(entry.knownAddresses),
      markets: uniqueSorted(entry.markets),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const OPERATOR_REGISTRY: OperatorRegistryEntry[] = buildOperatorRegistry()

/** Industry news feeds scanned for expansion / opening / leadership-change signals */
export const NEWS_FEEDS: { name: string; url: string }[] = [
  { name: 'Allwork.Space', url: 'https://allwork.space/feed/' },
  { name: 'Coworking Insights', url: 'https://coworkinginsights.com/feed/' },
]

/** Headline patterns that indicate expansion / market-entry / leadership signals */
export const NEWS_SIGNAL_PATTERNS: RegExp[] = [
  /\bopens?\b/i,
  /\bopening\b/i,
  /\bexpand(s|ing|sion)?\b/i,
  /\bnew location(s)?\b/i,
  /\blaunch(es|ing)?\b/i,
  /\bsigns? (a )?lease\b/i,
  /\bdebuts?\b/i,
  /\bacquir(es|ed|ing|sition)\b/i,
  /\bappoints?\b/i,
  /\bnames? .* (ceo|coo|cfo|president|managing director)\b/i,
  /\bjoins? as\b/i,
  /\bflagship\b/i,
]
