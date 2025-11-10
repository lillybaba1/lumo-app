'use server';

import { Coupon } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch coupons:', error);
      return [];
    }

    return (data || []).map(coupon => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.discount_type,
      value: coupon.discount_value,
      minOrderAmount: coupon.min_order_amount,
      maxDiscount: coupon.max_discount_amount,
      usageLimit: coupon.usage_limit,
      usedCount: coupon.used_count || 0,
      isActive: coupon.is_active,
      expiresAt: coupon.expires_at,
      createdAt: coupon.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return [];
  }
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error(`Failed to fetch coupon ${code}:`, error);
      return null;
    }

    return {
      id: data.id,
      code: data.code,
      type: data.discount_type,
      value: data.discount_value,
      minOrderAmount: data.min_order_amount,
      maxDiscount: data.max_discount_amount,
      usageLimit: data.usage_limit,
      usedCount: data.used_count || 0,
      isActive: data.is_active,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error(`Failed to fetch coupon ${code}:`, error);
    return null;
  }
}

export async function validateCoupon(code: string, orderAmount: number): Promise<Coupon | null> {
  try {
    const coupon = await getCouponByCode(code);

    if (!coupon) return null;
    if (!coupon.isActive) return null;

    // Check expiry
    if (coupon.expiresAt) {
      const expiryDate = new Date(coupon.expiresAt);
      if (expiryDate < new Date()) return null;
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return null;
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return null;
    }

    return coupon;
  } catch (error) {
    console.error(`Failed to validate coupon ${code}:`, error);
    return null;
  }
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'createdAt' | 'usedCount'>): Promise<Coupon> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        code: coupon.code.toUpperCase(),
        discount_type: coupon.type,
        discount_value: coupon.value,
        min_order_amount: coupon.minOrderAmount,
        max_discount_amount: coupon.maxDiscount,
        usage_limit: coupon.usageLimit,
        used_count: 0,
        is_active: coupon.isActive,
        expires_at: coupon.expiresAt,
      }])
      .select()
      .single();

    if (error) {
      console.error('Failed to create coupon:', error);
      throw new Error('Could not create coupon.');
    }

    return {
      id: data.id,
      code: data.code,
      type: data.discount_type,
      value: data.discount_value,
      minOrderAmount: data.min_order_amount,
      maxDiscount: data.max_discount_amount,
      usageLimit: data.usage_limit,
      usedCount: data.used_count || 0,
      isActive: data.is_active,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Failed to create coupon:', error);
    throw new Error('Could not create coupon.');
  }
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
  try {
    const supabase = await createClient();
    const updateData: Record<string, any> = {};

    if (updates.code !== undefined) updateData.code = updates.code.toUpperCase();
    if (updates.type !== undefined) updateData.discount_type = updates.type;
    if (updates.value !== undefined) updateData.discount_value = updates.value;
    if (updates.minOrderAmount !== undefined) updateData.min_order_amount = updates.minOrderAmount;
    if (updates.maxDiscount !== undefined) updateData.max_discount_amount = updates.maxDiscount;
    if (updates.usageLimit !== undefined) updateData.usage_limit = updates.usageLimit;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;

    const { error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error(`Failed to update coupon ${id}:`, error);
      throw new Error('Could not update coupon.');
    }
  } catch (error) {
    console.error(`Failed to update coupon ${id}:`, error);
    throw new Error('Could not update coupon.');
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete coupon ${id}:`, error);
      throw new Error('Could not delete coupon.');
    }
  } catch (error) {
    console.error(`Failed to delete coupon ${id}:`, error);
    throw new Error('Could not delete coupon.');
  }
}

export async function incrementCouponUsage(code: string): Promise<void> {
  try {
    const coupon = await getCouponByCode(code);
    if (!coupon) return;

    const supabase = await createClient();
    const { error } = await supabase
      .from('coupons')
      .update({ used_count: (coupon.usedCount || 0) + 1 })
      .eq('id', coupon.id);

    if (error) {
      console.error(`Failed to increment coupon usage for ${code}:`, error);
    }
  } catch (error) {
    console.error(`Failed to increment coupon usage for ${code}:`, error);
  }
}
