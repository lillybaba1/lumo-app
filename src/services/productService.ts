"use server";

import { Product, Category } from '@/lib/types';
import { products as mockProducts, categories as mockCategories } from '@/lib/mock-data';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Extract a user-friendly error message from a Supabase error
 */
function getSupabaseErrorMessage(error: any): string {
  if (!error) return 'Unknown error occurred.';

  // Check for PostgreSQL error codes
  const code = error.code;
  const message = error.message || '';
  const details = error.details || '';

  // Foreign key constraint violation (e.g., invalid category_id)
  if (code === '23503') {
    if (message.includes('category_id')) {
      return 'Invalid category selected. The category may have been deleted or does not exist.';
    }
    return 'Invalid reference: One of the selected values does not exist.';
  }

  // Unique constraint violation (e.g., duplicate SKU or barcode)
  if (code === '23505') {
    if (message.includes('sku')) {
      return 'SKU already exists. Please use a unique SKU.';
    }
    if (message.includes('barcode')) {
      return 'Barcode already exists. Please use a unique barcode.';
    }
    return 'Duplicate value detected. Please ensure all unique fields are unique.';
  }

  // NOT NULL constraint violation (e.g., missing required field)
  if (code === '23502') {
    // Extract column name from error message
    const match = message.match(/column "([^"]+)"/);
    if (match) {
      const column = match[1];
      // Convert snake_case to readable format
      const fieldName = column.split('_').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      return `Required field '${fieldName}' is missing.`;
    }
    return 'Required field is missing.';
  }

  // Check constraint violation
  if (code === '23514') {
    return `Validation failed: ${details || message}`;
  }

  // Return the original message if we don't have a specific handler
  if (message) {
    return message;
  }

  return 'An unexpected database error occurred.';
}

/**
 * Get all products from Supabase
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Failed to fetch products from Supabase:', error);
      return mockProducts;
    }

    if (!data || data.length === 0) {
      return mockProducts;
    }

    // Map Supabase data to Product type
    return data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: parseFloat(product.price),
      imageUrls: product.image_urls || [],
      productImages: product.product_images || [],
      foregroundImages: product.foreground_images || [],
      backgroundImages: product.background_images || [],
      category: product.category_id || '',
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
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return mockProducts;
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error(`Failed to fetch product ${id}:`, error);
      return null;
    }

    // Map Supabase data to Product type
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      imageUrls: data.image_urls || [],
      productImages: data.product_images || [],
      foregroundImages: data.foreground_images || [],
      backgroundImages: data.background_images || [],
      category: data.category_id || '',
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
    };
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
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
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return mockCategories;
  }
}

/**
 * Add a new product
 */
export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
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
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add product:', error);
      const errorMessage = getSupabaseErrorMessage(error);
      throw new Error(errorMessage);
    }

    return {
      id: data.id,
      ...product,
    };
  } catch (error) {
    console.error('Failed to add product:', error);
    // If it's already an Error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, try to extract a meaningful message
    const errorMessage = getSupabaseErrorMessage(error);
    throw new Error(errorMessage);
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
      const errorMessage = getSupabaseErrorMessage(error);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error(`Failed to update product ${product.id}:`, error);
    // If it's already an Error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, try to extract a meaningful message
    const errorMessage = getSupabaseErrorMessage(error);
    throw new Error(errorMessage);
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
      const errorMessage = getSupabaseErrorMessage(error);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error(`Failed to delete product ${id}:`, error);
    // If it's already an Error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, try to extract a meaningful message
    const errorMessage = getSupabaseErrorMessage(error);
    throw new Error(errorMessage);
  }
}
