"use server";

import { Product, Category } from '@/lib/types';
import { categories as mockCategories } from '@/lib/mock-data';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Get all products from Supabase
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        ),
        product_images!left (
          image_url,
          display_order,
          is_primary
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Failed to fetch products from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map Supabase data to Product type
    return data.map(product => {
      const images = Array.isArray(product.product_images) ? product.product_images : [];
      const orderedImageUrls = images
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((img: any) => img.image_url);

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        imageUrls: product.image_urls || [],
        productImages: orderedImageUrls,
        foregroundImages: product.foreground_images || [],
        backgroundImages: product.background_images || [],
        category: product.categories?.name || '',
        categoryId: product.category_id || '',
        stock: product.stock || 0,
        sku: product.sku,
        barcode: product.barcode,
        trackInventory: product.track_inventory,
        reorderPoint: product.reorder_point,
        reorderQuantity: product.reorder_quantity,
        stockByLocation: product.stock_by_location,
        weight: product.weight ? parseFloat(product.weight) : undefined,
        dimensions: product.dimensions,
        sellerId: product.seller_id,
      };
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

/**
 * Get a single product by ID with seller info
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        ),
        product_images!left (
          id,
          image_url,
          image_type,
          crop_x,
          crop_y,
          crop_width,
          crop_height,
          display_order,
          is_primary,
          alt_text,
          created_at,
          updated_at
        ),
        business_accounts:seller_id (
          id,
          business_name,
          contact_person_name,
          verification_status
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error(`Failed to fetch product ${id}:`, error);
      return null;
    }

    // Map Supabase data to Product type
    const images = Array.isArray(data.product_images)
      ? data.product_images
      : [];

    const orderedImageUrls = images
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((img: any) => img.image_url);

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      imageUrls: data.image_urls || [],
      productImages: orderedImageUrls,
      foregroundImages: data.foreground_images || [],
      backgroundImages: data.background_images || [],
      category: data.categories?.name || '',
      categoryId: data.category_id || '',
      stock: data.stock || 0,
      sku: data.sku,
      barcode: data.barcode,
      trackInventory: data.track_inventory,
      reorderPoint: data.reorder_point,
      reorderQuantity: data.reorder_quantity,
      stockByLocation: data.stock_by_location,
      weight: data.weight ? parseFloat(data.weight) : undefined,
      dimensions: data.dimensions,
      sellerId: data.seller_id,
      sellerName: data.business_accounts?.business_name,
      sellerVerified: data.business_accounts?.verification_status === 'verified',
    };
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
}

/**
 * Get products by seller ID
 */
export async function getProductsBySeller(sellerId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        ),
        product_images!left (
          image_url,
          display_order,
          is_primary
        )
      `)
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch seller products from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map Supabase data to Product type
    return data.map(product => {
      const images = Array.isArray(product.product_images) ? product.product_images : [];
      const orderedImageUrls = images
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((img: any) => img.image_url);

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        imageUrls: product.image_urls || [],
        productImages: orderedImageUrls,
        foregroundImages: product.foreground_images || [],
        backgroundImages: product.background_images || [],
        category: product.categories?.name || '',
        categoryId: product.category_id || '',
        stock: product.stock || 0,
        sku: product.sku,
        barcode: product.barcode,
        trackInventory: product.track_inventory,
        reorderPoint: product.reorder_point,
        reorderQuantity: product.reorder_quantity,
        stockByLocation: product.stock_by_location,
        weight: product.weight ? parseFloat(product.weight) : undefined,
        dimensions: product.dimensions,
        sellerId: product.seller_id,
      };
    });
  } catch (error) {
    console.error('Failed to fetch seller products:', error);
    return [];
  }
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Failed to fetch categories from Supabase:', error);
      return mockCategories;
    }

    if (!data || data.length === 0) {
      return mockCategories;
    }

    return data.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.image_url,
      icon: cat.icon,
      bgColor: cat.bg_color,
      textColor: cat.text_color,
      iconBgColor: cat.icon_bg_color,
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return mockCategories;
  }
}

/**
 * Add a new product
 */
export async function addProduct(product: Omit<Product, 'id'>, sellerId?: string): Promise<Product> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        price: product.price,
        image_urls: product.imageUrls || [],
        product_images: product.productImages || [],
        foreground_images: product.foregroundImages || [],
        background_images: product.backgroundImages || [],
        category_id: product.categoryId || product.category,
        stock: product.stock || 0,
        sku: product.sku,
        barcode: product.barcode,
        track_inventory: product.trackInventory ?? true,
        reorder_point: product.reorderPoint || 0,
        reorder_quantity: product.reorderQuantity || 0,
        stock_by_location: product.stockByLocation || {},
        weight: product.weight,
        dimensions: product.dimensions,
        seller_id: sellerId || product.sellerId,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add product:', error);
      throw new Error('Could not save product.');
    }

    return {
      id: data.id,
      ...product,
      sellerId: data.seller_id,
    };
  } catch (error) {
    console.error('Failed to add product:', error);
    throw new Error('Could not save product.');
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(product: Product): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({
        name: product.name,
        description: product.description,
        price: product.price,
        image_urls: product.imageUrls || [],
        product_images: product.productImages || [],
        foreground_images: product.foregroundImages || [],
        background_images: product.backgroundImages || [],
        category_id: product.categoryId || product.category,
        stock: product.stock || 0,
        sku: product.sku,
        barcode: product.barcode,
        track_inventory: product.trackInventory ?? true,
        reorder_point: product.reorderPoint || 0,
        reorder_quantity: product.reorderQuantity || 0,
        stock_by_location: product.stockByLocation || {},
        weight: product.weight,
        dimensions: product.dimensions,
      })
      .eq('id', product.id);

    if (error) {
      console.error(`Failed to update product ${product.id}:`, error);
      throw new Error('Could not update product.');
    }
  } catch (error) {
    console.error(`Failed to update product ${product.id}:`, error);
    throw new Error('Could not update product.');
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete product ${id}:`, error);
      throw new Error('Could not delete product.');
    }
  } catch (error) {
    console.error(`Failed to delete product ${id}:`, error);
    throw new Error('Could not delete product.');
  }
}
