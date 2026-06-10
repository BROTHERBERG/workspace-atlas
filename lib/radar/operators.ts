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
