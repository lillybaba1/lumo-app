'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Get user's boutique ID
async function getBoutiqueId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { data: businessAccount } = await supabase
    .from('business_accounts')
    .select('id')
    .eq('owner_user_id', user.id)
    .single();

  if (!businessAccount) throw new Error('No business account found');

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id')
    .eq('business_account_id', businessAccount.id)
    .single();

  if (!boutique) throw new Error('No boutique found');

  return boutique.id;
}

// Product Variants
export async function getProductVariants(productId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProductVariant(data: {
  product_id: string;
  name: string;
  sku?: string;
  option_values: Record<string, string>;
  price_adjustment?: number;
  stock_quantity?: number;
  image_url?: string;
  weight?: number;
}) {
  try {
    const supabase = await createClient();

    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true, data: variant };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProductVariant(
  id: string,
  data: {
    name?: string;
    sku?: string;
    option_values?: Record<string, string>;
    price_adjustment?: number;
    stock_quantity?: number;
    image_url?: string;
    weight?: number;
    is_active?: boolean;
    sort_order?: number;
  }
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('product_variants')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProductVariant(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Product Options
export async function getProductOptions(productId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('product_options')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProductOption(data: {
  product_id: string;
  name: string;
  display_type?: 'dropdown' | 'radio' | 'color_swatch' | 'image_swatch';
  values: string[];
}) {
  try {
    const supabase = await createClient();

    const { data: option, error } = await supabase
      .from('product_options')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true, data: option };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProductOption(
  id: string,
  data: {
    name?: string;
    display_type?: 'dropdown' | 'radio' | 'color_swatch' | 'image_swatch';
    values?: string[];
    sort_order?: number;
  }
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('product_options')
      .update(data)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProductOption(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('product_options')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Preorder Settings
export async function getPreorderSettings(productId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('product_preorders')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePreorderSettings(
  productId: string,
  data: {
    is_preorder: boolean;
    available_date?: string;
    deposit_required?: boolean;
    deposit_amount?: number;
    deposit_percentage?: number;
    max_preorder_quantity?: number;
    preorder_message?: string;
    shipping_estimate?: string;
  }
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('product_preorders')
      .upsert({
        product_id: productId,
        ...data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Inventory Alerts
export async function getInventoryAlerts() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('inventory_alerts')
      .select(`
        *,
        product:products(id, name),
        variant:product_variants(id, name)
      `)
      .eq('boutique_id', boutiqueId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createInventoryAlert(data: {
  product_id?: string;
  variant_id?: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'back_in_stock';
  threshold?: number;
}) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('inventory_alerts')
      .insert({
        boutique_id: boutiqueId,
        ...data,
      });

    if (error) throw error;

    revalidatePath('/business/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function dismissInventoryAlert(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('inventory_alerts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Product Tags
export async function getProductTags() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('product_tags')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('name');

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProductTag(data: { name: string; color?: string }) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const slug = data.name.toLowerCase().replace(/\s+/g, '-');

    const { data: tag, error } = await supabase
      .from('product_tags')
      .insert({
        boutique_id: boutiqueId,
        slug,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true, data: tag };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProductTag(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('product_tags')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignTagToProduct(productId: string, tagId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('product_tag_assignments')
      .insert({ product_id: productId, tag_id: tagId });

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeTagFromProduct(productId: string, tagId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('product_tag_assignments')
      .delete()
      .match({ product_id: productId, tag_id: tagId });

    if (error) throw error;

    revalidatePath('/business/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Bulk update stock
export async function bulkUpdateStock(updates: { variant_id: string; stock_quantity: number }[]) {
  try {
    const supabase = await createClient();

    for (const update of updates) {
      const { error } = await supabase
        .from('product_variants')
        .update({ 
          stock_quantity: update.stock_quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.variant_id);

      if (error) throw error;
    }

    revalidatePath('/business/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
