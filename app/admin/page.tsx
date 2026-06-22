import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Users, Star, TrendingUp, Wand2, Briefcase, MapPin } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { marketStats } from "@/lib/spaces"

export default function AdminDashboardPage() {
  const s = marketStats()

  const tiles = [
    { label: "Total Spaces", value: s.total, note: "live in the directory", icon: Building },
    { label: "In Calgary", value: s.calgary, note: "core market coverage", icon: MapPin },
    { label: "Web-services leads", value: s.webUpgradeCount, note: "weak / missing sites", icon: Wand2 },
    { label: "Recruitment leads", value: s.talentCount, note: "hiring signals surfaced", icon: Briefcase },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cal">
          Workscape<span className="text-[#caa406]"> Atlas</span> Admin
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/spaces/new">
            <Button className="bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(249,203,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              Add New Space
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.label}</CardTitle>
              <t.icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t.value}</div>
              <p className="text-xs text-gray-500">{t.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Market snapshot</CardTitle>
              <CardDescription>Live figures from the latest scan</CardDescription>
            </div>
            <Badge className="shrink-0 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">Live data</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Independent operators", value: s.independents },
                { label: "National chains", value: s.chains },
                { label: "Scored on live web signals", value: s.scored },
                { label: "Average digital score", value: s.avgScore },
                { label: "Confirmed live openings", value: s.liveOpenings },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <p className="font-medium">{row.label}</p>
                  <span className="font-cal text-lg">{row.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/admin/spaces/new">
                <Button className="w-full justify-start bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(249,203,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                  <Building className="mr-2 h-4 w-4" /> Add Space
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start border-2 border-black">
                  <Users className="mr-2 h-4 w-4" /> Manage Users
                </Button>
              </Link>
              <Link href="/admin/spaces?filter=pending">
                <Button variant="outline" className="w-full justify-start border-2 border-black">
                  <Star className="mr-2 h-4 w-4" /> Review Pending
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full justify-start border-2 border-black">
                  <TrendingUp className="mr-2 h-4 w-4" /> View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
