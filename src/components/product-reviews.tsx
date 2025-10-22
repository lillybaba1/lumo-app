"use client";

import { useState } from 'react';
import { Review } from '@/lib/types';
import { StarRating } from './star-rating';
import { StarRatingInput } from './star-rating-input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, User } from 'lucide-react';
import { createReview, markReviewHelpful } from '@/services/reviewService';

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  currentUserId?: string;
  currentUserName?: string;
  userHasReviewed?: boolean;
}

export function ProductReviews({
  productId,
  reviews: initialReviews,
  averageRating,
  totalReviews,
  currentUserId,
  currentUserName,
  userHasReviewed = false,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      toast({
        title: "Please log in",
        description: "You must be logged in to leave a review.",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const newReview = await createReview({
        productId,
        userId: currentUserId,
        userName: currentUserName || 'Anonymous',
        rating,
        comment,
      });

      setReviews([newReview, ...reviews]);
      setShowReviewForm(false);
      setRating(0);
      setComment('');

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId);
      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
      ));
      toast({
        title: "Thank you!",
        description: "Your feedback has been recorded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update review.",
        variant: "destructive",
      });
    }
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating - 1]++;
      }
    });
    return distribution.reverse();
  };

  const ratingDistribution = getRatingDistribution();

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="text-center md:text-left">
              <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
              <StarRating rating={averageRating} size="lg" className="justify-center md:justify-start mb-2" />
              <p className="text-sm text-muted-foreground">Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars, index) => {
                const count = ratingDistribution[index];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-12">{stars} star</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write Review Button */}
          {!userHasReviewed && !showReviewForm && (
            <div>
              <Button onClick={() => setShowReviewForm(true)} className="w-full md:w-auto">
                Write a Review
              </Button>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium mb-2">Your Rating</label>
                <StarRatingInput value={rating} onChange={setRating} />
              </div>

              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium mb-2">
                  Your Review
                </label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false);
                    setRating(0);
                    setComment('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold font-headline">All Reviews</h3>
          {reviews.map((review, index) => (
            <div key={review.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{review.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                <p className="text-sm leading-relaxed">{review.comment}</p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkHelpful(review.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful ({review.helpful})
                  </Button>
                </div>
              </div>

              {index < reviews.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </div>
      )}

      {reviews.length === 0 && !showReviewForm && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        </div>
      )}
    </div>
  );
}
