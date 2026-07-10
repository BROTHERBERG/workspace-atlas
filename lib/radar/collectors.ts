import * as fs from 'fs'
import * as path from 'path'
import { classifyRole, classifySeniority } from './classify'
import { discoverOperatorUrls, DiscoveredUrls, DiscoveryStore, isBareRootUrl, loadDiscoveryStore, saveDiscoveryStore } from './discovery'
import { OperatorRegistryEntry } from './operators'
import { SnapshotDiffResult, normalizePageHtml, snapshotArtifactsDir, snapshotPage, snapshotSlug } from './snapshot'
import { RadarSignal } from './types'

export interface TeamMember {
  name: string
  title: string
}

export interface CareersRole {
  title: string
  excerpt: string
}

export interface OperatorCollectorResult {
  operator: string
  operatorId: string
  discovered: DiscoveredUrls
  teamSnapshot?: SnapshotDiffResult
  careersSnapshot?: SnapshotDiffResult
  roster: TeamMember[]
  roles: CareersRole[]
  signals: RadarSignal[]
}

const TITLE_KEYWORDS =
  /\b(ceo|coo|cfo|cto|chief|founder|president|director|vp|vice president|head of|general manager|community manager|manager|lead|operations|sales|marketing|people|finance|growth|partnerships|hospitality)\b/i
const TITLEISH_NAME_WORDS =
  /\b(assistant|associate|coordinator|curator|director|manager|lead|host|profile|programme|program|programmes|events|facilities|operations|administrative|accounts|caretaking|rooms|membership|experience|infrastructure)\b/i
const INTERIM_TITLE = /\b(interim|acting)\b/i
const LEADERSHIP_ROLE = /\b(gm|general manager|director|vp|vice president|head of|coo|ceo)\b/i
const COMMUNITY_MANAGER = /\bcommunity manager\b/i

function cleanLine(line: string): string {
  return line
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function textLines(textOrHtml: string): string[] {
  const text = /<\w+[\s>]/.test(textOrHtml) ? normalizePageHtml(textOrHtml) : textOrHtml
  return text
    .split(/\n+/)
    .map(cleanLine)
    .filter((line) => line.length >= 2 && line.length <= 180)
}

function isLikelyName(value: string): boolean {
  if (!value || value.length > 60) return false
  if (value === value.toUpperCase()) return false
  if (TITLE_KEYWORDS.test(value)) return false
  if (TITLEISH_NAME_WORDS.test(value)) return false
  if (/\b(team|careers|contact|location|privacy|workspace|membership|book|tour|home|about)\b/i.test(value)) return false
  const words = value.split(/\s+/)
  if (words.length < 2 || words.length > 4) return false
  return words.every((word) => /^[A-Z][A-Za-z'.-]+$/.test(word))
}

function normalizeName(name: string): string {
  return cleanLine(name).replace(/\s+/g, ' ')
}

function normalizeTitle(title: string): string {
  return cleanLine(title)
    .replace(/^(is|as|our)\s+/i, '')
    .replace(/\s+at\s+.+$/i, '')
}

function splitNameTitle(line: string): TeamMember | null {
  const parts = line.split(/\s+(?:-|–|—|\||,)\s+/).map(cleanLine)
  if (parts.length < 2) return null
  const [name, ...titleParts] = parts
  const title = titleParts.join(' - ')
  if (!isLikelyName(name) || !TITLE_KEYWORDS.test(title)) return null
  return { name: normalizeName(name), title: normalizeTitle(title) }
}

export function parseTeamRoster(textOrHtml: string): TeamMember[] {
  const lines = textLines(textOrHtml)
  const roster = new Map<string, TeamMember>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const inline = splitNameTitle(line)
    if (inline) {
      roster.set(inline.name.toLowerCase(), inline)
      continue
    }

    if (!isLikelyName(line)) continue
    const nearby = [lines[i + 1], lines[i + 2]].filter(Boolean) as string[]
    const title = nearby.find((candidate) => TITLE_KEYWORDS.test(candidate) && candidate.length <= 100)
    if (!title) continue
    roster.set(line.toLowerCase(), { name: normalizeName(line), title: normalizeTitle(title) })
  }

  return Array.from(roster.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function roleLine(line: string): CareersRole | null {
  const compact = cleanLine(line)
  if (compact.length < 4 || compact.length > 140) return null
  if (!LEADERSHIP_ROLE.test(compact) && !COMMUNITY_MANAGER.test(compact)) return null
  if (/\b(blog|article|privacy|cookie|newsletter|what we do|team member spotlight)\b/i.test(compact)) return null
  return { title: compact, excerpt: compact }
}

export function parseCareersRoles(textOrHtml: string): CareersRole[] {
  const roles = new Map<string, CareersRole>()
  for (const line of textLines(textOrHtml)) {
    const role = roleLine(line)
    if (role) roles.set(role.title.toLowerCase(), role)
  }
  return Array.from(roles.values()).sort((a, b) => a.title.localeCompare(b.title))
}

function signalBase(
  operator: string,
  type: RadarSignal['type'],
  title: string,
  url: string,
  source: string,
  firstSeen: string,
  confidence: number,
  excerpt: string
): RadarSignal {
  return {
    id: `${type}:${snapshotSlug(operator)}:${snapshotSlug(title)}:${snapshotSlug(url).slice(0, 32)}`,
    type,
    operator,
    title,
    roleCategory: classifyRole(title),
    seniority: classifySeniority(title),
    locationRaw: '',
    url,
    source,
    confidence,
    evidence: [{ url, source, firstSeen, title, excerpt }],
    firstSeen,
    lastSeen: firstSeen,
    status: 'active',
    summary: excerpt,
  }
}

export function diffTeamRosters(previous: TeamMember[], current: TeamMember[], operator: string, url: string, firstSeen: string): RadarSignal[] {
  if (isBareRootUrl(url)) return []

  const signals: RadarSignal[] = []
  const currentByName = new Map(current.map((member) => [member.name.toLowerCase(), member]))
  const previousByName = new Map(previous.map((member) => [member.name.toLowerCase(), member]))

  for (const oldMember of previous) {
    if (currentByName.has(oldMember.name.toLowerCase())) continue
    const excerpt = `${oldMember.name} - ${oldMember.title}`
    signals.push(signalBase(operator, 'team_departure', `${oldMember.name} departed team page`, url, 'team-page roster diff', firstSeen, 0.85, excerpt))
  }

  for (const member of current) {
    const previousMember = previousByName.get(member.name.toLowerCase())
    if (!INTERIM_TITLE.test(member.title)) continue
    if (previousMember?.title === member.title) continue
    const excerpt = previousMember ? `${member.name} - ${previousMember.title} -> ${member.title}` : `${member.name} - ${member.title}`
    signals.push(signalBase(operator, 'interim_title', `${member.name} has interim title`, url, 'team-page roster diff', firstSeen, 0.9, excerpt))
  }

  return signals
}

export function diffCareersRoles(previous: CareersRole[], current: CareersRole[], operator: string, url: string, firstSeen: string): RadarSignal[] {
  const previousTitles = new Set(previous.map((role) => role.title.toLowerCase()))
  const signals: RadarSignal[] = []

  for (const role of current) {
    if (previousTitles.has(role.title.toLowerCase())) continue
    const isLeadership = LEADERSHIP_ROLE.test(role.title)
    const isCommunity = COMMUNITY_MANAGER.test(role.title)
    if (!isLeadership && !isCommunity) continue
    signals.push(signalBase(operator, 'careers_added', role.title, url, 'careers-page diff', firstSeen, isLeadership ? 0.9 : 0.5, role.excerpt))
  }

  return signals
}

function rosterPath(operatorId: string): string {
  return path.join(snapshotArtifactsDir(operatorId, 'team-page'), 'latest-roster.json')
}

function rolesPath(operatorId: string): string {
  return path.join(snapshotArtifactsDir(operatorId, 'careers-page'), 'latest-roles.json')
}

function readJsonArray<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return []
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[]
  } catch {
    return []
  }
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function isThinTeam(roster: TeamMember[], snapshot: SnapshotDiffResult): boolean {
  return roster.length === 0 && !snapshot.rendered
}

function isThinCareers(roles: CareersRole[], snapshot: SnapshotDiffResult): boolean {
  return roles.length === 0 && !snapshot.rendered
}

export async function collectOperatorS2S3(
  operator: OperatorRegistryEntry,
  options: { store?: DiscoveryStore; forceDiscovery?: boolean } = {}
): Promise<OperatorCollectorResult> {
  const operatorId = snapshotSlug(operator.name)
  const store = options.store ?? loadDiscoveryStore()
  let { urls: discovered } = await discoverOperatorUrls(operator, { store, force: options.forceDiscovery })
  const firstSeen = new Date().toISOString()
  const signals: RadarSignal[] = []
  let roster: TeamMember[] = []
  let roles: CareersRole[] = []
  let teamSnapshot: SnapshotDiffResult | undefined
  let careersSnapshot: SnapshotDiffResult | undefined

  if (discovered.teamPageUrl) {
    const previousRoster = readJsonArray<TeamMember>(rosterPath(operatorId))
    teamSnapshot = await snapshotPage({ operatorId, pageKey: 'team-page', url: discovered.teamPageUrl })
    if (teamSnapshot.error && /\bHTTP 404\b/.test(teamSnapshot.error)) {
      store[operatorId] = { ...discovered, teamPageUrl: null, discoveredAt: new Date().toISOString() }
      saveDiscoveryStore(store)
      discovered = (await discoverOperatorUrls(operator, { store, force: true })).urls
      teamSnapshot = discovered.teamPageUrl ? await snapshotPage({ operatorId, pageKey: 'team-page', url: discovered.teamPageUrl }) : undefined
    }

    const teamUrl = discovered.teamPageUrl
    if (teamSnapshot && teamUrl && !isBareRootUrl(teamUrl)) {
      const hadTeamBaseline = teamSnapshot.status === 'baseline'
      roster = parseTeamRoster(teamSnapshot.rawHtml ?? teamSnapshot.normalizedText ?? '')
      if (isThinTeam(roster, teamSnapshot)) {
        teamSnapshot = await snapshotPage({ operatorId, pageKey: 'team-page', url: teamUrl, render: true })
        roster = parseTeamRoster(teamSnapshot.rawHtml ?? teamSnapshot.normalizedText ?? '')
      }
      if (!hadTeamBaseline && teamSnapshot.status === 'changed') signals.push(...diffTeamRosters(previousRoster, roster, operator.name, teamUrl, firstSeen))
    }
    writeJson(rosterPath(operatorId), roster)
  }

  if (discovered.careersUrl) {
    const previousRoles = readJsonArray<CareersRole>(rolesPath(operatorId))
    careersSnapshot = await snapshotPage({ operatorId, pageKey: 'careers-page', url: discovered.careersUrl })
    if (careersSnapshot.error && /\bHTTP 404\b/.test(careersSnapshot.error)) {
      store[operatorId] = { ...discovered, careersUrl: null, discoveredAt: new Date().toISOString() }
      saveDiscoveryStore(store)
      discovered = (await discoverOperatorUrls(operator, { store, force: true })).urls
      careersSnapshot = discovered.careersUrl ? await snapshotPage({ operatorId, pageKey: 'careers-page', url: discovered.careersUrl }) : undefined
    }

    const careersUrl = discovered.careersUrl
    if (careersSnapshot && careersUrl) {
      const hadCareersBaseline = careersSnapshot.status === 'baseline'
      roles = parseCareersRoles(careersSnapshot.rawHtml ?? careersSnapshot.normalizedText ?? '')
      if (isThinCareers(roles, careersSnapshot)) {
        careersSnapshot = await snapshotPage({ operatorId, pageKey: 'careers-page', url: careersUrl, render: true })
        roles = parseCareersRoles(careersSnapshot.rawHtml ?? careersSnapshot.normalizedText ?? '')
      }
      if (!hadCareersBaseline && careersSnapshot.status === 'changed') signals.push(...diffCareersRoles(previousRoles, roles, operator.name, careersUrl, firstSeen))
    }
    writeJson(rolesPath(operatorId), roles)
  }

  return { operator: operator.name, operatorId, discovered, teamSnapshot, careersSnapshot, roster, roles, signals }
}
