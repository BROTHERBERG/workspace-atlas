'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { fetchWithCsrf } from '@/lib/csrf-client'

const talentRequestSchema = z.object({
  contactName: z.string().min(1, 'Your name is required'),
  email: z.string().email('Valid email is required'),
  spaceName: z.string().min(1, 'Space or company name is required'),
  location: z.string().optional(),
  role: z.string().min(1, 'Please select a role'),
  timeline: z.string().optional(),
  notes: z.string().optional(),
})

type TalentRequestFormData = z.infer<typeof talentRequestSchema>

const ROLE_OPTIONS = [
  'General Manager',
  'Community Manager',
  'Head of Sales / Leasing',
  'Operations Manager',
  'Regional / Area Manager',
  'C-Suite (CEO / COO / CFO)',
  'Marketing Lead',
  'Other',
]

const TIMELINE_OPTIONS = ['ASAP', 'Within 30 days', 'Within 90 days', 'Exploring']

export function TalentRequestForm({ defaultSpaceName }: { defaultSpaceName?: string }) {
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TalentRequestFormData>({
    resolver: zodResolver(talentRequestSchema),
    defaultValues: { spaceName: defaultSpaceName ?? '' },
  })

  async function onSubmit(data: TalentRequestFormData) {
    setIsLoading(true)

    try {
      const response = await fetchWithCsrf('/api/talent-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }

      toast.success("Talent request received! We'll connect you with matched leadership candidates within 48 hours.")
      reset()
    } catch (error) {
      logger.error('Talent request error:', error instanceof Error ? error : new Error(String(error)))
      toast.error(error instanceof Error ? error.message : 'Failed to submit request')
    } finally {
      setIsLoading(false)
    }
  }

  const selectClasses =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactName">Your Name</Label>
          <Input id="contactName" placeholder="Jane Smith" disabled={isLoading} {...register('contactName')} />
          {errors.contactName && <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="your.email@example.com" disabled={isLoading} {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="spaceName">Space / Company Name</Label>
          <Input id="spaceName" placeholder="Your coworking space or company" disabled={isLoading} {...register('spaceName')} />
          {errors.spaceName && <p className="mt-1 text-sm text-red-600">{errors.spaceName.message}</p>}
        </div>
        <div>
          <Label htmlFor="location">Location (Optional)</Label>
          <Input id="location" placeholder="City, Country" disabled={isLoading} {...register('location')} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="role">Role You&apos;re Hiring For</Label>
          <select id="role" className={selectClasses} disabled={isLoading} defaultValue="" {...register('role')}>
            <option value="" disabled>
              Select a role…
            </option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
        </div>
        <div>
          <Label htmlFor="timeline">Hiring Timeline (Optional)</Label>
          <select id="timeline" className={selectClasses} disabled={isLoading} defaultValue="" {...register('timeline')}>
            <option value="">Select a timeline…</option>
            {TIMELINE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Tell us about the role (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="What does success look like in this role? Team size, key responsibilities, compensation range…"
          className="min-h-[120px]"
          disabled={isLoading}
          {...register('notes')}
        />
        <p className="mt-1 text-sm text-gray-500">The more context you share, the better the candidate match.</p>
      </div>

      <Button type="submit" className="w-full bg-[#f9cb16] text-black hover:bg-yellow-400" disabled={isLoading}>
        {isLoading ? 'Submitting…' : 'Request Talent'}
      </Button>
    </form>
  )
}
