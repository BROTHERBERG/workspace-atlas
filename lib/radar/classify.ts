import { RoleCategory, Seniority } from './types'

const CATEGORY_RULES: { category: RoleCategory; patterns: RegExp[] }[] = [
  {
    category: 'general_management',
    patterns: [
      /\bgeneral manager\b/i,
      /\barea (general )?manager\b/i,
      /\bregional (general )?manager\b/i,
      /\b(location|cent(er|re)|site|building|club|campus) (general )?manager\b/i,
      /\bcity lead\b/i,
    ],
  },
  {
    category: 'community',
    patterns: [
      /\bcommunity\b/i,
      /\bmember(ship)? (experience|services|success|manager)\b/i,
      /\bfront of house\b/i,
      /\bhospitality\b/i,
      /\bguest experience\b/i,
    ],
  },
  {
    category: 'sales',
    patterns: [
      /\bsales\b/i,
      /\bbusiness development\b/i,
      /\baccount (executive|manager)\b/i,
      /\bpartnership/i,
      /\bleasing\b/i,
      /\brevenue\b/i,
      /\bbroker/i,
    ],
  },
  {
    category: 'operations',
    patterns: [
      /\boperations?\b/i,
      /\bfacilit(y|ies)\b/i,
      /\bworkplace experience\b/i,
      /\boffice manager\b/i,
      /\bmaintenance\b/i,
      /\bproperty manage/i,
    ],
  },
  {
    category: 'marketing',
    patterns: [/\bmarketing\b/i, /\bgrowth\b/i, /\bbrand\b/i, /\bcontent\b/i, /\bsocial media\b/i, /\bevents? (manager|coordinator|producer)\b/i],
  },
  {
    category: 'finance',
    patterns: [/\bfinance\b/i, /\baccount(ing|ant)\b/i, /\bcontroller\b/i, /\bfp&a\b/i, /\bpayroll\b/i],
  },
  {
    category: 'people',
    patterns: [/\bpeople\b/i, /\bhuman resources\b/i, /\bhr\b/i, /\btalent\b/i, /\brecruit/i],
  },
  {
    category: 'tech',
    patterns: [/\bengineer/i, /\bdeveloper\b/i, /\bproduct (manager|designer|owner)\b/i, /\bdata (analyst|scientist|engineer)\b/i, /\bdesigner\b/i, /\bit support\b/i],
  },
]

const EXECUTIVE_PATTERNS: RegExp[] = [
  /\bchief\b/i,
  /\bceo\b/i,
  /\bcoo\b/i,
  /\bcfo\b/i,
  /\bcmo\b/i,
  /\bcro\b/i,
  /\bpresident\b/i,
  /\bmanaging director\b/i,
  /\bexecutive director\b/i,
]

export function classifyRole(title: string): RoleCategory {
  if (EXECUTIVE_PATTERNS.some((p) => p.test(title))) return 'executive'
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(title))) return rule.category
  }
  return 'other'
}

export function classifySeniority(title: string): Seniority {
  if (EXECUTIVE_PATTERNS.some((p) => p.test(title)) || /\bfounder\b/i.test(title)) return 'c_suite'
  if (/\b(vp|vice president|director|head of)\b/i.test(title)) return 'vp_director'
  if (/\b(manager|lead|supervisor)\b/i.test(title)) return 'manager'
  return 'staff'
}

/** Days between firstSeen and now — used to flag hard-to-fill roles */
export function daysOpen(firstSeen: string, now: Date = new Date()): number {
  const first = new Date(firstSeen).getTime()
  return Math.max(0, Math.floor((now.getTime() - first) / 86_400_000))
}
