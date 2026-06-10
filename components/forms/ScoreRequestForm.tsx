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

const scoreRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
  spaceName: z.string().min(1, 'Space name is required'),
  website: z.string().url('Valid website URL is required').optional().or(z.literal('')),
  description: z.string().optional(),
})

type ScoreRequestFormData = z.infer<typeof scoreRequestSchema>

export function ScoreRequestForm() {
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScoreRequestFormData>({
    resolver: zodResolver(scoreRequestSchema),
  })

  async function onSubmit(data: ScoreRequestFormData) {
    setIsLoading(true)

    try {
      const response = await fetchWithCsrf('/api/score-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          website: data.website || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }

      toast.success('Score request submitted! We\'ll analyze your space and get back to you within 24-48 hours.')
      reset()
    } catch (error) {
      logger.error('Score request error:', error instanceof Error ? error : new Error(String(error)))
      toast.error(error instanceof Error ? error.message : 'Failed to submit request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            disabled={isLoading}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="spaceName">Space Name</Label>
          <Input
            id="spaceName"
            placeholder="Your coworking space name"
            disabled={isLoading}
            {...register('spaceName')}
          />
          {errors.spaceName && (
            <p className="mt-1 text-sm text-red-600">{errors.spaceName.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <Label htmlFor="website">Website URL (Optional)</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://yourspace.com"
          disabled={isLoading}
          {...register('website')}
        />
        {errors.website && (
          <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="description">Tell us about your space (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Brief description of your coworking space, location, amenities, etc."
          className="min-h-[120px]"
          disabled={isLoading}
          {...register('description')}
        />
        <p className="mt-1 text-sm text-gray-500">
          This helps us provide more accurate scoring and recommendations.
        </p>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Submitting Request...' : 'Get My Digital Score'}
      </Button>
      
      <div className="text-sm text-gray-600 text-center">
        <p>Our team will analyze your digital presence across:</p>
        <ul className="mt-2 space-y-1">
          <li>• Website quality and functionality</li>
          <li>• Social media presence</li>
          <li>• Online reviews and ratings</li>
          <li>• Digital marketing effectiveness</li>
        </ul>
      </div>
    </form>
  )
}