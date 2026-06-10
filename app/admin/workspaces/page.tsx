import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import WorkspaceActions from '@/components/admin/WorkspaceActions'

interface SearchParams {
  search?: string
  status?: string
  page?: string
}

export default async function AdminWorkspaces({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { city: { contains: params.search, mode: 'insensitive' } },
      { country: { contains: params.search, mode: 'insensitive' } }
    ]
  }
  if (params.status) {
    where.status = params.status
  }

  const [workspaces, total] = await Promise.all([
    prisma.workspace.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        _count: {
          select: { reviews: true }
        }
      }
    }),
    prisma.workspace.count({ where })
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-cal mb-2">Workspace Management</h1>
        <p className="text-gray-400">Manage all workspace listings on the platform</p>
      </div>

      {/* Filters */}
      <Card className="bg-black border-2 border-gray-800 mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-4">
            <Input
              name="search"
              placeholder="Search by name, city, or country..."
              defaultValue={params.search}
              className="flex-1 bg-gray-900 border-gray-800"
            />
            <Select name="status" defaultValue={params.status || 'all'}>
              <SelectTrigger className="w-48 bg-gray-900 border-gray-800">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="bg-yellow-500 text-black hover:bg-yellow-400">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {workspaces.filter(w => w.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {workspaces.filter(w => w.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {workspaces.filter(w => w.status === 'SUSPENDED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workspace List */}
      <div className="space-y-4">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="bg-black border-2 border-gray-800 hover:border-yellow-500 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{workspace.name}</CardTitle>
                    <Badge
                      variant={
                        workspace.status === 'ACTIVE' ? 'default' :
                        workspace.status === 'PENDING' ? 'secondary' :
                        workspace.status === 'SUSPENDED' ? 'destructive' :
                        'outline'
                      }
                    >
                      {workspace.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    <div className="space-y-1">
                      <p>{workspace.city}, {workspace.country}</p>
                      <p>Owner: {workspace.user?.name || 'System'} ({workspace.user?.email || 'N/A'})</p>
                      <p>Digital Score: {workspace.digitalScore}/100 • {workspace._count.reviews} reviews</p>
                      <p className="text-xs">Created: {new Date(workspace.createdAt).toLocaleDateString()}</p>
                    </div>
                  </CardDescription>
                </div>
                <WorkspaceActions workspace={workspace} />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={`/admin/workspaces?page=${page - 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}`}>
              <Button variant="outline">Previous</Button>
            </Link>
          )}
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/workspaces?page=${page + 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}`}>
              <Button variant="outline">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}