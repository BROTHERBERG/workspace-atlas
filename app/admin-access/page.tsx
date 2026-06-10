'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithCsrf } from '@/lib/csrf-client'

export default function AdminAccessPage() {
  const router = useRouter()
  const [key, setKey] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetchWithCsrf('/api/admin-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Access denied')
      }
      router.push('/admin/radar')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Access denied')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1f1f1f] px-4">
      <Card className="w-full max-w-sm border-2 border-gray-800 bg-black text-white">
        <CardHeader>
          <CardTitle className="font-cal flex items-center gap-2 text-2xl">
            <KeyRound className="h-6 w-6 text-[#f9cb16]" />
            Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="key" className="text-gray-300">
                Access key
              </Label>
              <Input
                id="key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={isLoading}
                className="border-gray-700 bg-gray-900 text-white"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full bg-[#f9cb16] text-black hover:bg-yellow-400" disabled={isLoading || !key}>
              {isLoading ? 'Checking…' : 'Enter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
