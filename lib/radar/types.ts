export type SignalType =
  | 'job_posting'
  | 'news'
  | 'expansion_news'
  | 'careers_added'
  | 'team_departure'
  | 'interim_title'
  | 'poach'
  | 'aged_posting'
  | 'permit'
  | 'location_page'
  | 'funding_ma'
  | 'licence_change'

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

export interface SignalEvidence {
  url: string
  source: string
  /** ISO date this evidence was first observed, if known */
  firstSeen?: string
  title?: string
  excerpt?: string
}

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
  /** 0-1 confidence score */
  confidence?: number
  evidence?: SignalEvidence[]
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
