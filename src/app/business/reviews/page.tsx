'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  MessageSquare,
  Flag,
  ThumbsUp,
  Award,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  Truck,
  Package,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getReviews,
  getRatingSummary,
  getBadges,
  respondToReview,
  updateReviewResponse,
} from './actions';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string;
  rating: number;
  title?: string;
  content?: string;
  communication_rating?: number;
  shipping_rating?: number;
  quality_rating?: number;
  images: string[];
  is_verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  helpful_count: number;
  created_at: string;
  response?: {
    id: string;
    content: string;
    created_at: string;
  };
}

interface RatingSummary {
  average_rating: number;
  total_reviews: number;
  rating_1_count: number;
  rating_2_count: number;
  rating_3_count: number;
  rating_4_count: number;
  rating_5_count: number;
  average_communication?: number;
  average_shipping?: number;
  average_quality?: number;
}

interface SellerBadge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  tier: number;
  earned_at: string;
}

export default function ReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [badges, setBadges] = useState<SellerBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [respondingTo, setRespondingTo] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    
    const [reviewsResult, summaryResult, badgesResult] = await Promise.all([
      getReviews(activeTab === 'all' ? undefined : activeTab as any),
      getRatingSummary(),
      getBadges(),
    ]);

    if (reviewsResult.success) {
      setReviews(reviewsResult.data || []);
    }
    if (summaryResult.success) {
      setSummary(summaryResult.data);
    }
    if (badgesResult.success) {
      setBadges(badgesResult.data || []);
    }
    
    setLoading(false);
  }

  function openResponseDialog(review: Review) {
    setRespondingTo(review);
    setResponseText(review.response?.content || '');
  }

  async function handleSubmitResponse() {
    if (!respondingTo || !responseText.trim()) return;

    setSubmitting(true);
    
    let result;
    if (respondingTo.response) {
      result = await updateReviewResponse(respondingTo.response.id, responseText);
    } else {
      result = await respondToReview(respondingTo.id, responseText);
    }

    if (result.success) {
      toast({ title: respondingTo.response ? 'Response updated' : 'Response added' });
      setRespondingTo(null);
      setResponseText('');
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }

    setSubmitting(false);
  }

  function renderStars(rating: number, size: 'sm' | 'md' = 'md') {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  }

  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews & Ratings</h1>
          <p className="text-muted-foreground">
            Manage customer feedback and build your reputation
          </p>
        </div>
        <Button variant="outline" onClick={() => loadData()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {summary?.average_rating?.toFixed(1) || '0.0'}
              </span>
              {renderStars(Math.round(summary?.average_rating || 0))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {summary?.total_reviews || 0} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Communication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {summary?.average_communication?.toFixed(1) || '-'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Response quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {summary?.average_shipping?.toFixed(1) || '-'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Delivery speed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {summary?.average_quality?.toFixed(1) || '-'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Product quality</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Your Badges
            </CardTitle>
            <CardDescription>Badges earned based on your performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{ borderColor: badge.color }}
                >
                  <Award className="h-5 w-5" style={{ color: badge.color }} />
                  <div>
                    <p className="font-medium text-sm">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Distribution */}
      {summary && summary.total_reviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = summary[`rating_${rating}_count` as keyof RatingSummary] as number || 0;
                const percentage = summary.total_reviews > 0 
                  ? (count / summary.total_reviews) * 100 
                  : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="w-12 text-sm text-muted-foreground">
                      {rating} star
                    </span>
                    <Progress value={percentage} className="flex-1" />
                    <span className="w-12 text-sm text-muted-foreground text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Reviews</TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="responded">Responded</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Star className="h-8 w-8 mb-2" />
                  <p>No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            {review.customer_avatar ? (
                              <img
                                src={review.customer_avatar}
                                alt={review.customer_name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-primary font-medium">
                                {review.customer_name?.[0]?.toUpperCase() || 'C'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{review.customer_name || 'Customer'}</span>
                              {review.is_verified_purchase && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(review.rating, 'sm')}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            review.status === 'approved' ? 'default' :
                            review.status === 'pending' ? 'secondary' :
                            review.status === 'flagged' ? 'destructive' : 'outline'
                          }>
                            {review.status}
                          </Badge>
                        </div>
                      </div>

                      {review.title && (
                        <h4 className="font-medium mt-3">{review.title}</h4>
                      )}
                      {review.content && (
                        <p className="text-muted-foreground mt-2">{review.content}</p>
                      )}

                      {/* Sub-ratings */}
                      {(review.communication_rating || review.shipping_rating || review.quality_rating) && (
                        <div className="flex gap-4 mt-3 text-sm">
                          {review.communication_rating && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>Communication: {review.communication_rating}/5</span>
                            </div>
                          )}
                          {review.shipping_rating && (
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              <span>Shipping: {review.shipping_rating}/5</span>
                            </div>
                          )}
                          {review.quality_rating && (
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              <span>Quality: {review.quality_rating}/5</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Review image ${idx + 1}`}
                              className="h-16 w-16 rounded object-cover"
                            />
                          ))}
                        </div>
                      )}

                      {/* Response */}
                      {review.response && (
                        <div className="mt-4 ml-6 pl-4 border-l-2 border-primary/20">
                          <p className="text-sm font-medium">Your Response</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {review.response.content}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.response.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openResponseDialog(review)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {review.response ? 'Edit Response' : 'Respond'}
                        </Button>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{review.helpful_count} helpful</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={() => setRespondingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {respondingTo?.response ? 'Edit Response' : 'Respond to Review'}
            </DialogTitle>
            <DialogDescription>
              Your response will be visible to all customers viewing this review.
            </DialogDescription>
          </DialogHeader>
          {respondingTo && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  {renderStars(respondingTo.rating, 'sm')}
                  <span className="font-medium">{respondingTo.customer_name}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {respondingTo.content || respondingTo.title || 'No comment'}
                </p>
              </div>
              <Textarea
                placeholder="Write your response..."
                rows={4}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingTo(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse} disabled={!responseText.trim() || submitting}>
              {respondingTo?.response ? 'Update Response' : 'Submit Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
