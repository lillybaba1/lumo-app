"use server";

import { Wishlist } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export async function getWishlistByUser(userId: string): Promise<Wishlist | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      productIds: data.product_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Wishlist;
  } catch (error) {
    console.error(`Failed to fetch wishlist for user ${userId}:`, error);
    return null;
  }
}


export async function createWishlist(userId: string): Promise<Wishlist> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: userId,
        product_ids: [],
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Could not create wishlist.');
    }

    return {
      id: data.id,
      userId: data.user_id,
      productIds: data.product_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Wishlist;
  } catch (error) {
    console.error('Failed to create wishlist:', error);
    throw new Error('Could not create wishlist.');
  }
}


export async function addToWishlist(userId: string, productId: string): Promise<void> {
  try {
    let wishlist = await getWishlistByUser(userId);

    if (!wishlist) {
      wishlist = await createWishlist(userId);
    }

    const supabase = await createClient();
    
    // Add product to array if not already present
    const updatedProductIds = wishlist.productIds.includes(productId)
      ? wishlist.productIds
      : [...wishlist.productIds, productId];
    
    const { error } = await supabase
      .from('wishlists')
      .update({
        product_ids: updatedProductIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wishlist.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`Failed to add product ${productId} to wishlist:`, error);
    throw new Error('Could not add product to wishlist.');
  }
}


export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  try {
    const wishlist = await getWishlistByUser(userId);
    if (!wishlist) return;

    const supabase = await createClient();
    
    // Remove product from array
    const updatedProductIds = wishlist.productIds.filter(id => id !== productId);
    
    const { error } = await supabase
      .from('wishlists')
      .update({
        product_ids: updatedProductIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wishlist.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`Failed to remove product ${productId} from wishlist:`, error);
    throw new Error('Could not remove product from wishlist.');
  }
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const wishlist = await getWishlistByUser(userId);
    if (!wishlist) return false;
    return wishlist.productIds.includes(productId);
  } catch (error) {
    console.error(`Failed to check if product ${productId} is in wishlist:`, error);
    return false;
  }
}

export async function clearWishlist(userId: string): Promise<void> {
  try {
    const wishlist = await getWishlistByUser(userId);
    if (!wishlist) return;

    const supabase = await createClient();
    
    const { error } = await supabase
      .from('wishlists')
      .update({
        product_ids: [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', wishlist.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`Failed to clear wishlist for user ${userId}:`, error);
    throw new Error('Could not clear wishlist.');
  }
}
