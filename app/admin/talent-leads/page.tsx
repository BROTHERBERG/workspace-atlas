import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Download, Mail, MapPin, Clock } from 'lucide-react'
import * as fs from 'fs'
import * as path from 'path'

export const dynamic = 'force-dynamic'

interface TalentLead {
  id: string
  contactName: string
  email: string
  spaceName: string
  location?: string
  role: string
  timeline?: string
  notes?: string
  status: string
  submittedAt: string
}

interface ScoreLead {
  id: string
  email: string
  spaceName: string
  websiteUrl?: string
  status: string
  submittedAt: string
}

function loadJson<T>(file: string): T[] {
  const fullPath = path.join(process.cwd(), 'data', 'leads', file)
  if (!fs.existsSync(fullPath)) return []
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
  } catch {
    return []
  }
}

export default function AdminTalentLeadsPage() {
  const talentLeads = loadJson<TalentLead>('talent-requests.json').sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const scoreLeads = loadJson<ScoreLead>('score-requests.json').sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  const thisWeek = talentLeads.filter((l) => Date.now() - new Date(l.submittedAt).getTime() < 7 * 86_400_000)

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-cal mb-2 flex items-center gap-3 text-4xl">
              <Users className="h-9 w-9 text-[#f9cb16]" />
              Leads
            </h1>
            <p className="text-gray-400">Talent requests and Score-My-Space submissions — the pipeline.</p>
          </div>
          <Button asChild className="bg-[#f9cb16] text-black hover:bg-yellow-400">
            <a href="/api/admin/leads-export">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Talent requests', value: talentLeads.length },
            { label: 'New this week', value: thisWeek.length },
            { label: 'Score requests', value: scoreLeads.length },
            { label: 'Total pipeline', value: talentLeads.length + scoreLeads.length },
          ].map((stat) => (
            <Card key={stat.label} className="border-2 border-gray-800 bg-black">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-gray-400">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Talent requests */}
        <h2 className="font-cal mb-4 text-2xl">Talent requests</h2>
        <div className="mb-10 space-y-3">
          {talentLeads.length === 0 && (
            <Card className="border-2 border-gray-800 bg-black">
              <CardContent className="py-8 text-center text-gray-400">
                No talent requests yet. They land here from /request-talent and the directory CTAs.
              </CardContent>
            </Card>
          )}
          {talentLeads.map((lead) => (
            <Card key={lead.id} className="border-2 border-gray-800 bg-black transition-colors hover:border-[#f9cb16]">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{lead.role}</span>
                      <Badge variant="outline" className="border-[#f9cb16] text-[#f9cb16]">
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-gray-300">{lead.spaceName}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {lead.contactName} · {lead.email}
                      </span>
                      {lead.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {lead.location}
                        </span>
                      )}
                      {lead.timeline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {lead.timeline}
                        </span>
                      )}
                    </div>
                    {lead.notes && <p className="mt-2 max-w-2xl text-sm text-gray-400">{lead.notes}</p>}
                  </div>
                  <div className="text-xs text-gray-500">{lead.submittedAt.slice(0, 10)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Score requests */}
        <h2 className="font-cal mb-4 text-2xl">Score-My-Space requests</h2>
        <div className="space-y-3">
          {scoreLeads.length === 0 && (
            <Card className="border-2 border-gray-800 bg-black">
              <CardContent className="py-8 text-center text-gray-400">No score requests yet.</CardContent>
            </Card>
          )}
          {scoreLeads.map((lead) => (
            <Card key={lead.id} className="border-2 border-gray-800 bg-black transition-colors hover:border-[#f9cb16]">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <span className="font-medium text-white">{lead.spaceName}</span>
                  <div className="mt-1 text-sm text-gray-400">
                    {lead.email}
                    {lead.websiteUrl && <span> · {lead.websiteUrl}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-gray-700 text-gray-400">
                    {lead.status}
                  </Badge>
                  <span className="text-xs text-gray-500">{lead.submittedAt.slice(0, 10)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
