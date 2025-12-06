'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

// ============ COUPON ACTIONS ============

export async function createCouponAction(data: {
  sellerId: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  appliesTo: 'all' | 'specific';
  productIds?: string[];
  startsAt?: string;
  expiresAt?: string;
}) {
  try {
    const { error } = await supabaseAdmin
      .from('seller_coupons')
      .insert({
        seller_id: data.sellerId,
        code: data.code.toUpperCase(),
        description: data.description,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        min_purchase: data.minPurchase || 0,
        max_discount: data.maxDiscount,
        usage_limit: data.usageLimit,
        per_customer_limit: data.perCustomerLimit || 1,
        applies_to: data.appliesTo,
        product_ids: data.productIds,
        starts_at: data.startsAt || new Date().toISOString(),
        expires_at: data.expiresAt,
        is_active: true,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A coupon with this code already exists' };
      }
      throw error;
    }

    revalidatePath('/business/promotions');
    return { success: true };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { success: false, error: 'Failed to create coupon' };
  }
}

export async function updateCouponAction(id: string, data: {
  code?: string;
  description?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  appliesTo?: 'all' | 'specific';
  productIds?: string[];
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}) {
  try {
    const updates: any = {};
    if (data.code !== undefined) updates.code = data.code.toUpperCase();
    if (data.description !== undefined) updates.description = data.description;
    if (data.discountType !== undefined) updates.discount_type = data.discountType;
    if (data.discountValue !== undefined) updates.discount_value = data.discountValue;
    if (data.minPurchase !== undefined) updates.min_purchase = data.minPurchase;
    if (data.maxDiscount !== undefined) updates.max_discount = data.maxDiscount;
    if (data.usageLimit !== undefined) updates.usage_limit = data.usageLimit;
    if (data.perCustomerLimit !== undefined) updates.per_customer_limit = data.perCustomerLimit;
    if (data.appliesTo !== undefined) updates.applies_to = data.appliesTo;
    if (data.productIds !== undefined) updates.product_ids = data.productIds;
    if (data.startsAt !== undefined) updates.starts_at = data.startsAt;
    if (data.expiresAt !== undefined) updates.expires_at = data.expiresAt;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('seller_coupons')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/promotions');
    return { success: true };
  } catch (error) {
    console.error('Error updating coupon:', error);
    return { success: false, error: 'Failed to update coupon' };
  }
}

export async function deleteCouponAction(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('seller_coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/promotions');
    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error: 'Failed to delete coupon' };
  }
}

// ============ FLASH SALE ACTIONS ============

export async function createFlashSaleAction(data: {
  sellerId: string;
  name: string;
  description?: string;
  discountPercentage: number;
  productIds: string[];
  startsAt: string;
  endsAt: string;
}) {
  try {
    const { error } = await supabaseAdmin
      .from('flash_sales')
      .insert({
        seller_id: data.sellerId,
        name: data.name,
        description: data.description,
        discount_percentage: data.discountPercentage,
        product_ids: data.productIds,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        is_active: true,
      });

    if (error) throw error;

    revalidatePath('/business/promotions');
    return { success: true };
  } catch (error) {
    console.error('Error creating flash sale:', error);
    return { success: false, error: 'Failed to create flash sale' };
  }
}

export async function updateFlashSaleAction(id: string, data: {
  name?: string;
  description?: string;
  discountPercentage?: number;
  productIds?: string[];
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}) {
  try {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.discountPercentage !== undefined) updates.discount_percentage = data.discountPercentage;
    if (data.productIds !== undefined) updates.product_ids = data.productIds;
    if (data.startsAt !== undefined) updates.starts_at = data.startsAt;
    if (data.endsAt !== undefined) updates.ends_at = data.endsAt;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('flash_sales')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/promotions');
    return { success: true };
  } catch (error) {
    console.error('Error updating flash sale:', error);
    return { success: false, error: 'Failed to update flash sale' };
  }
}

export async function deleteFlashSaleAction(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('flash_sales')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/promotions');
    return { success: true };
  } catch (error) {
    console.error('Error deleting flash sale:', error);
    return { success: false, error: 'Failed to delete flash sale' };
  }
}

// ============ BUNDLE DEAL ACTIONS ============

export async function createBundleAction(data: {
  sellerId: string;
  name: string;
  description?: string;
  productIds: string[];
  bundlePrice: number;
  originalPrice: number;
}) {
  try {
    const { error } = await supabaseAdmin
      .from('bundle_deals')
      .insert({
        seller_id: data.sellerId,
        name: data.name,
        description: data.description,
        product_ids: data.productIds,
        bundle_price: data.bundlePrice,
        original_price: data.originalPrice,
        is_active: true,
      });

    if (error) throw error;

    revalidatePath('/business/promotions');
    return { success: true };
  } catch (error) {
    console.error('Error creating bundle:', error);
    return { success: false, error: 'Failed to create bundle' };
  }
}

export async function updateBundleAction(id: string, data: {
  name?: string;
  description?: string;
  productIds?: string[];
  bundlePrice?: number;
  originalPrice?: number;
  isActive?: boolean;
}) {
  try {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.productIds !== undefined) updates.product_ids = data.productIds;
    if (data.bundlePrice !== undefined) updates.bundle_price = data.bundlePrice;
    if (data.originalPrice !== undefined) updates.original_price = data.originalPrice;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('bundle_deals')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/promotions');
    return { success: true };
  } catch (error) {
    console.error('Error updating bundle:', error);
    return { success: false, error: 'Failed to update bundle' };
  }
}

export async function deleteBundleAction(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('bundle_deals')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/promotions');
    return { success: true };
  } catch (error) {
    console.error('Error deleting bundle:', error);
    return { success: false, error: 'Failed to delete bundle' };
  }
}

// ============ COUPON VALIDATION (for checkout) ============

export async function validateCouponAction(code: string, sellerId: string, userId?: string, cartTotal?: number) {
  try {
    const { data: coupon, error } = await supabaseAdmin
      .from('seller_coupons')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, error: 'Coupon has expired' };
    }

    // Check start date
    if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
      return { valid: false, error: 'Coupon is not yet active' };
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    // Check minimum purchase
    if (cartTotal && coupon.min_purchase && cartTotal < coupon.min_purchase) {
      return { valid: false, error: `Minimum purchase of $${coupon.min_purchase} required` };
    }

    // Check per-customer limit
    if (userId && coupon.per_customer_limit) {
      const { count } = await supabaseAdmin
        .from('coupon_usage')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId);

      if (count && count >= coupon.per_customer_limit) {
        return { valid: false, error: 'You have already used this coupon' };
      }
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        maxDiscount: coupon.max_discount,
        appliesTo: coupon.applies_to,
        productIds: coupon.product_ids,
      }
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, error: 'Failed to validate coupon' };
  }
}
