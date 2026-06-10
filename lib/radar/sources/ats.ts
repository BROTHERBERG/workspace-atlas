import { RawPosting } from '../types'

/**
 * Free public ATS job-board endpoints. No API keys, no metered cost.
 * Every fetcher returns null when the board doesn't exist (wrong token
 * guess) or the request fails — the scanner treats null as "board not
 * found" and a [] as "board exists, zero postings".
 */

const TIMEOUT_MS = 10_000

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/json', 'User-Agent': 'WorkscapeAtlas-Radar/1.0' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchGreenhouse(token: string): Promise<RawPosting[] | null> {
  const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs`)
  if (!data || !Array.isArray(data.jobs)) return null
  return data.jobs.map((j: any) => ({
    externalId: `gh-${token}-${j.id}`,
    title: String(j.title ?? '').trim(),
    url: j.absolute_url ?? `https://boards.greenhouse.io/${token}/jobs/${j.id}`,
    locationRaw: j.location?.name ?? '',
    postedAt: j.first_published ?? j.updated_at ?? undefined,
  }))
}

export async function fetchLever(token: string): Promise<RawPosting[] | null> {
  const data = await getJson(`https://api.lever.co/v0/postings/${token}?mode=json`)
  if (!Array.isArray(data)) return null
  return data.map((j: any) => ({
    externalId: `lever-${token}-${j.id}`,
    title: String(j.text ?? '').trim(),
    url: j.hostedUrl ?? '',
    locationRaw: j.categories?.location ?? '',
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
  }))
}

export async function fetchAshby(token: string): Promise<RawPosting[] | null> {
  const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${token}`)
  if (!data || !Array.isArray(data.jobs)) return null
  return data.jobs.map((j: any) => ({
    externalId: `ashby-${token}-${j.id}`,
    title: String(j.title ?? '').trim(),
    url: j.jobUrl ?? j.applyUrl ?? '',
    locationRaw: j.location ?? '',
    postedAt: j.publishedAt ?? undefined,
  }))
}

export async function fetchSmartRecruiters(company: string): Promise<RawPosting[] | null> {
  const data = await getJson(`https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=100`)
  if (!data || !Array.isArray(data.content)) return null
  return data.content.map((j: any) => ({
    externalId: `sr-${company}-${j.id}`,
    title: String(j.name ?? '').trim(),
    url: `https://jobs.smartrecruiters.com/${company}/${j.id}`,
    locationRaw: [j.location?.city, j.location?.country].filter(Boolean).join(', '),
    postedAt: j.releasedDate ?? undefined,
  }))
}

export async function fetchWorkable(account: string): Promise<RawPosting[] | null> {
  const data = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${account}?details=false`)
  if (!data || !Array.isArray(data.jobs)) return null
  return data.jobs.map((j: any) => ({
    externalId: `workable-${account}-${j.shortcode ?? j.code ?? j.id}`,
    title: String(j.title ?? '').trim(),
    url: j.url ?? `https://apply.workable.com/${account}/j/${j.shortcode}/`,
    locationRaw: [j.city, j.country].filter(Boolean).join(', '),
    postedAt: j.published_on ?? undefined,
  }))
}

export type AtsKind = 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'workable'

export const ATS_FETCHERS: Record<AtsKind, (token: string) => Promise<RawPosting[] | null>> = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
  workable: fetchWorkable,
}
