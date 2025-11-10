'use server';

import { Review, ProductStats } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export async function getAllReviews(): Promise<Review[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch all reviews:', error);
      return [];
    }

    return (data || []).map(review => ({
      id: review.id,
      productId: review.product_id,
      userId: review.user_id,
      userName: review.user_name,
      rating: review.rating,
      comment: review.comment,
      helpful: review.helpful || 0,
      createdAt: review.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch all reviews:', error);
    return [];
  }
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Failed to fetch reviews for product ${productId}:`, error);
      return [];
    }

    return (data || []).map(review => ({
      id: review.id,
      productId: review.product_id,
      userId: review.user_id,
      userName: review.user_name,
      rating: review.rating,
      comment: review.comment,
      helpful: review.helpful || 0,
      createdAt: review.created_at,
    }));
  } catch (error) {
    console.error(`Failed to fetch reviews for product ${productId}:`, error);
    return [];
  }
}

export async function getProductStats(productId: string): Promise<ProductStats> {
  try {
    const reviews = await getReviewsByProduct(productId);

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        totalSales: 0,
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      totalSales: 0, // This will be calculated from orders
    };
  } catch (error) {
    console.error(`Failed to get product stats for ${productId}:`, error);
    return {
      averageRating: 0,
      totalReviews: 0,
      totalSales: 0,
    };
  }
}

export async function createReview(review: Omit<Review, 'id' | 'createdAt' | 'helpful'>): Promise<Review> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        product_id: review.productId,
        user_id: review.userId,
        user_name: review.userName,
        rating: review.rating,
        comment: review.comment,
        helpful: 0,
      }])
      .select()
      .single();

    if (error) {
      console.error('Failed to create review:', error);
      throw new Error('Could not create review.');
    }

    return {
      id: data.id,
      productId: data.product_id,
      userId: data.user_id,
      userName: data.user_name,
      rating: data.rating,
      comment: data.comment,
      helpful: data.helpful || 0,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Failed to create review:', error);
    throw new Error('Could not create review.');
  }
}

export async function updateReview(id: string, updates: Partial<Review>): Promise<void> {
  try {
    const supabase = await createClient();
    const updateData: Record<string, any> = {};
    
    if (updates.rating !== undefined) updateData.rating = updates.rating;
    if (updates.comment !== undefined) updateData.comment = updates.comment;
    if (updates.userName !== undefined) updateData.user_name = updates.userName;

    const { error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error(`Failed to update review ${id}:`, error);
      throw new Error('Could not update review.');
    }
  } catch (error) {
    console.error(`Failed to update review ${id}:`, error);
    throw new Error('Could not update review.');
  }
}

export async function deleteReview(id: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete review ${id}:`, error);
      throw new Error('Could not delete review.');
    }
  } catch (error) {
    console.error(`Failed to delete review ${id}:`, error);
    throw new Error('Could not delete review.');
  }
}

export async function markReviewHelpful(id: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Get current helpful count
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('helpful')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error(`Failed to fetch review ${id}:`, fetchError);
      throw new Error('Could not fetch review.');
    }

    // Increment helpful count
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ helpful: (review.helpful || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      console.error(`Failed to mark review ${id} as helpful:`, updateError);
      throw new Error('Could not update review.');
    }
  } catch (error) {
    console.error(`Failed to mark review ${id} as helpful:`, error);
    throw new Error('Could not update review.');
  }
}

export async function getUserReviewForProduct(userId: string, productId: string): Promise<Review | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Failed to get user review:', error);
      return null;
    }

    return {
      id: data.id,
      productId: data.product_id,
      userId: data.user_id,
      userName: data.user_name,
      rating: data.rating,
      comment: data.comment,
      helpful: data.helpful || 0,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Failed to get user review:', error);
    return null;
  }
}
