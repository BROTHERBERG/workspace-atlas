export type SignalType = 'job_posting' | 'news'

export type RoleCategory =
  | 'executive'
  | 'general_management'
  | 'community'
  | 'sales'
  | 'operations'
  | 'marketing'
  | 'finance'
  | 'people'
  | 'tech'
  | 'other'

export type Seniority = 'c_suite' | 'vp_director' | 'manager' | 'staff'

export type SignalStatus = 'active' | 'closed'

export interface RadarSignal {
  /** Stable id: `${source}:${externalId}` */
  id: string
  type: SignalType
  /** Canonical operator name from the roster (or publication name for news) */
  operator: string
  title: string
  roleCategory: RoleCategory
  seniority: Seniority
  locationRaw: string
  url: string
  source: string
  /** ISO date the source reports the posting/article was published, if known */
  postedAt?: string
  /** ISO date this scanner first saw the signal */
  firstSeen: string
  /** ISO date this scanner last saw the signal */
  lastSeen: string
  status: SignalStatus
  /** Short excerpt — used for news signals */
  summary?: string
}

export interface RawPosting {
  externalId: string
  title: string
  url: string
  locationRaw: string
  postedAt?: string
}

export interface ScanSourceResult {
  /** e.g. "greenhouse:industriousoffice" */
  board: string
  operator: string
  ok: boolean
  count: number
  error?: string
}
