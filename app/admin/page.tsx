import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Users, Star, TrendingUp, Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cal">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/spaces/new">
            <Button className="bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(249,203,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              Add New Space
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spaces</CardTitle>
            <Building className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-gray-500">+5 from last month</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,453</div>
            <p className="text-xs text-gray-500">+43 from last month</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified Spaces</CardTitle>
            <Star className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-gray-500">37.5% of total spaces</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Digital Score</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.3</div>
            <p className="text-xs text-gray-500">+2.5 from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Space Added", user: "Admin", item: "Workspace 10", time: "2 hours ago" },
                { action: "Space Verified", user: "Admin", item: "Workspace 5", time: "5 hours ago" },
                { action: "User Registered", user: "System", item: "john.doe@example.com", time: "1 day ago" },
                { action: "Space Updated", user: "Admin", item: "Workspace 3", time: "2 days ago" },
                { action: "Space Featured", user: "Admin", item: "Workspace 7", time: "3 days ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-500">
                      {activity.user} • {activity.item}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
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
              <Link href="/admin/settings">
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
