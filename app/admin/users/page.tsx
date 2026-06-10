import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import UserActions from '@/components/admin/UserActions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

interface SearchParams {
  search?: string
  role?: string
  page?: string
}

export default async function AdminUsers({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
      { email: { contains: params.search, mode: 'insensitive' } }
    ]
  }
  if (params.role && params.role !== 'all') {
    where.role = params.role
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            workspaces: true,
            reviews: true
          }
        },
        havenPassport: {
          select: {
            id: true,
            tier: true,
            points: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ])

  const totalPages = Math.ceil(total / limit)

  // Get role stats
  const roleStats = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-cal mb-2">User Management</h1>
        <p className="text-gray-400">Manage platform users and their permissions</p>
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
              placeholder="Search by name or email..."
              defaultValue={params.search}
              className="flex-1 bg-gray-900 border-gray-800"
            />
            <Select name="role" defaultValue={params.role || 'all'}>
              <SelectTrigger className="w-48 bg-gray-900 border-gray-800">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="WORKSPACE_OWNER">Workspace Owner</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
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
            <CardTitle className="text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        {roleStats.map((stat) => (
          <Card key={stat.role} className="bg-black border-2 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{stat.role.replace('_', ' ')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat._count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User List */}
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="bg-black border-2 border-gray-800 hover:border-yellow-500 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12 border-2 border-gray-800">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="bg-gray-900">
                      {user.name?.charAt(0) || user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle>{user.name || 'Unnamed User'}</CardTitle>
                      <Badge
                        variant={
                          user.role === 'ADMIN' ? 'destructive' :
                          user.role === 'SPACE_OWNER' ? 'secondary' :
                          'default'
                        }
                      >
                        {user.role.replace('_', ' ')}
                      </Badge>
                      {user.emailVerified && (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      <div className="space-y-1">
                        <p>{user.email}</p>
                        <p className="text-xs">
                          {user._count.workspaces} workspaces • 
                          {user._count.reviews} reviews • 
                          {user.havenPassport ? `Passport: ${user.havenPassport.tier} (${user.havenPassport.points} pts)` : 'No passport'}
                        </p>
                        <p className="text-xs">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardDescription>
                  </div>
                </div>
                <UserActions user={user} />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={`/admin/users?page=${page - 1}${params.search ? `&search=${params.search}` : ''}${params.role ? `&role=${params.role}` : ''}`}>
              <Button variant="outline">Previous</Button>
            </Link>
          )}
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/users?page=${page + 1}${params.search ? `&search=${params.search}` : ''}${params.role ? `&role=${params.role}` : ''}`}>
              <Button variant="outline">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}