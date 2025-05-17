import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Star, Search, Plus, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"

// Mock data for spaces
const spaces = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  name: `Workspace ${i + 1}`,
  location: ["New York", "London", "Berlin", "Singapore", "Tokyo", "Paris"][i % 6],
  digitalScore: Math.floor(70 + Math.random() * 25),
  featured: i % 5 === 0,
  verified: i % 3 === 0 || i % 7 === 0,
  status: ["Active", "Pending", "Draft"][i % 3],
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
}))

export default function AdminSpacesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cal">Manage Spaces</h1>
        <Link href="/admin/spaces/new">
          <Button className="bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(249,203,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            <Plus className="mr-2 h-4 w-4" /> Add New Space
          </Button>
        </Link>
      </div>

      <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Search spaces..." className="pl-8" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer border-black hover:bg-gray-100">
                All
              </Badge>
              <Badge variant="outline" className="cursor-pointer border-black hover:bg-gray-100">
                Active
              </Badge>
              <Badge variant="outline" className="cursor-pointer border-black hover:bg-gray-100">
                Pending
              </Badge>
              <Badge variant="outline" className="cursor-pointer border-black hover:bg-gray-100">
                Draft
              </Badge>
              <Badge variant="outline" className="cursor-pointer border-black hover:bg-gray-100">
                Featured
              </Badge>
              <Badge variant="outline" className="cursor-pointer border-black hover:bg-gray-100">
                Verified
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Digital Score</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spaces.map((space) => (
                <TableRow key={space.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {space.name}
                      {space.featured && <Badge className="bg-[#f9cb16] text-black">Featured</Badge>}
                      {space.verified && (
                        <Badge className="bg-white text-black border">
                          <Star className="mr-1 h-3 w-3 fill-[#f9cb16] text-[#f9cb16]" /> Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{space.location}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        space.status === "Active"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : space.status === "Pending"
                            ? "bg-[#f9cb16]-100 text-[#f9cb16]-800 border-[#f9cb16]"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                      }
                    >
                      {space.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            space.digitalScore >= 90
                              ? "bg-green-500"
                              : space.digitalScore >= 70
                                ? "bg-[#f9cb16]"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${space.digitalScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{space.digitalScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>{space.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/spaces/${space.id}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/spaces/${space.id}/edit`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
