'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Eye, Shield, Ban, UserCheck, Trash2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UserActionsProps {
  user: {
    id: string
    email: string
    role: string
    emailVerified: Date | null
  }
}

export default function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateRole = async (role: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      if (!res.ok) throw new Error('Failed to update role')
      
      toast.success(`User role updated to ${role}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update user role')
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: 'POST'
      })

      if (!res.ok) throw new Error('Failed to verify email')
      
      toast.success('Email verified')
      router.refresh()
    } catch (error) {
      toast.error('Failed to verify email')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete user')
      
      toast.success('User deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black border-gray-800">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />
        
        <Link href={`/admin/users/${user.id}`}>
          <DropdownMenuItem>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuItem>
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-gray-800" />
        
        {!user.emailVerified && (
          <DropdownMenuItem onClick={verifyEmail}>
            <UserCheck className="h-4 w-4 mr-2 text-green-500" />
            Verify Email
          </DropdownMenuItem>
        )}
        
        {user.role !== 'ADMIN' && (
          <DropdownMenuItem onClick={() => updateRole('ADMIN')}>
            <Shield className="h-4 w-4 mr-2 text-purple-500" />
            Make Admin
          </DropdownMenuItem>
        )}
        
        {user.role !== 'WORKSPACE_OWNER' && (
          <DropdownMenuItem onClick={() => updateRole('WORKSPACE_OWNER')}>
            <Shield className="h-4 w-4 mr-2 text-blue-500" />
            Make Workspace Owner
          </DropdownMenuItem>
        )}
        
        {user.role !== 'USER' && (
          <DropdownMenuItem onClick={() => updateRole('USER')}>
            <Ban className="h-4 w-4 mr-2 text-orange-500" />
            Demote to User
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className="bg-gray-800" />
        
        <DropdownMenuItem onClick={deleteUser} className="text-red-500">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}