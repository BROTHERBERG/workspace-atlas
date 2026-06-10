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
import { MoreVertical, Edit, Eye, Check, X, Ban, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface WorkspaceActionsProps {
  workspace: {
    id: string
    status: string
    slug: string
  }
}

export default function WorkspaceActions({ workspace }: WorkspaceActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/workspaces/${workspace.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!res.ok) throw new Error('Failed to update status')
      
      toast.success(`Workspace ${status.toLowerCase()}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update workspace status')
    } finally {
      setLoading(false)
    }
  }

  const deleteWorkspace = async () => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/workspaces/${workspace.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete workspace')
      
      toast.success('Workspace deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete workspace')
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
        
        <Link href={`/spaces/${workspace.slug || workspace.id}`}>
          <DropdownMenuItem>
            <Eye className="h-4 w-4 mr-2" />
            View Public Page
          </DropdownMenuItem>
        </Link>
        
        <Link href={`/admin/spaces/${workspace.id}/edit`}>
          <DropdownMenuItem>
            <Edit className="h-4 w-4 mr-2" />
            Edit Details
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuSeparator className="bg-gray-800" />
        
        {workspace.status === 'PENDING' && (
          <>
            <DropdownMenuItem onClick={() => updateStatus('ACTIVE')}>
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus('REJECTED')}>
              <X className="h-4 w-4 mr-2 text-red-500" />
              Reject
            </DropdownMenuItem>
          </>
        )}
        
        {workspace.status === 'ACTIVE' && (
          <DropdownMenuItem onClick={() => updateStatus('SUSPENDED')}>
            <Ban className="h-4 w-4 mr-2 text-orange-500" />
            Suspend
          </DropdownMenuItem>
        )}
        
        {workspace.status === 'SUSPENDED' && (
          <DropdownMenuItem onClick={() => updateStatus('ACTIVE')}>
            <Check className="h-4 w-4 mr-2 text-green-500" />
            Reactivate
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className="bg-gray-800" />
        
        <DropdownMenuItem onClick={deleteWorkspace} className="text-red-500">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}