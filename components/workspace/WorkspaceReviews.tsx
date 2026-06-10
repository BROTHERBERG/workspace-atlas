'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  helpful: number
  unhelpful: number
  verified: boolean
  createdAt: Date
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

interface UserReview {
  id: string
  rating: number
  title: string | null
  content: string | null
}

interface WorkspaceReviewsProps {
  workspaceId: string
  reviews: Review[]
  totalReviews: number
  userReview: UserReview | null
  canReview: boolean
}

export function WorkspaceReviews({ 
  workspaceId, 
  reviews, 
  totalReviews, 
  userReview, 
  canReview 
}: WorkspaceReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 
      : 0
  }))

  const handleSubmitReview = async () => {
    if (!newReview.content.trim()) {
      toast.error('Please write a review')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          rating: newReview.rating,
          title: newReview.title.trim() || null,
          content: newReview.content.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit review')
      }

      toast.success('Review submitted successfully!')
      setShowReviewForm(false)
      setNewReview({ rating: 5, title: '', content: '' })
      // Refresh page to show new review
      window.location.reload()
    } catch (error) {
      logger.error('Review submission error:', error instanceof Error ? error : new Error(String(error)))
      toast.error(error instanceof Error ? error.message : 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            Reviews ({totalReviews})
          </div>
          {canReview && !showReviewForm && (
            <Button size="sm" onClick={() => setShowReviewForm(true)}>
              Write Review
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(averageRating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-500">
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-12">
                    <span className="text-sm">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User's existing review */}
        {userReview && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Your Review</h3>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < userReview.rating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {userReview.title && (
              <h4 className="font-medium mb-1">{userReview.title}</h4>
            )}
            {userReview.content && (
              <p className="text-sm text-gray-700">{userReview.content}</p>
            )}
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-4">Write a Review</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          rating <= newReview.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  placeholder="Brief summary of your experience"
                  className="w-full p-2 border rounded-md"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Review</label>
                <Textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  placeholder="Share your experience with this workspace..."
                  className="min-h-[100px]"
                  maxLength={1000}
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleSubmitReview} 
                  disabled={isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowReviewForm(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No reviews yet. Be the first to review this workspace!
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.user.image || ''} />
                    <AvatarFallback>
                      {review.user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {review.user.name || 'Anonymous'}
                          </span>
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {review.title && (
                      <h4 className="font-medium mb-1">{review.title}</h4>
                    )}
                    
                    {review.content && (
                      <p className="text-gray-700 text-sm mb-3">{review.content}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <button className="flex items-center space-x-1 hover:text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{review.helpful}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-red-600">
                        <ThumbsDown className="h-4 w-4" />
                        <span>{review.unhelpful}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Reviews */}
        {totalReviews > reviews.length && (
          <div className="text-center">
            <Button variant="outline">
              Load More Reviews ({totalReviews - reviews.length} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}