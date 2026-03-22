"use server";

import { Product, Category } from '@/lib/types';
import { categories as mockCategories, products as mockProducts } from '@/lib/mock-data';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

const productLogger = logger.child('ProductService');

/**
 * Type for product image from DB
 */
interface DbProductImage {
  image_url: string;
  display_order: number | null;
}

export interface GetProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc' | 'name_desc';
  productIds?: string[]; // Filter to only these product IDs (for collections)
}

export interface PaginatedProducts {
  data: Product[];
  count: number;
}

/**
 * Get paginated products from Supabase with filtering
 */
export async function getProductsPaginated(options: GetProductsOptions = {}): Promise<PaginatedProducts> {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    categoryId,
    minPrice,
    maxPrice,
    sortBy = 'name_asc',
    productIds
  } = options;

  try {
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        ),
        business_accounts:seller_id (
          business_name
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters — search product name, description, or store name
    if (search) {
      // Sanitize PostgREST special characters to prevent filter injection
      const sanitized = search.replace(/[%_\\(),.*]/g, '');
      if (sanitized.length === 0) {
        // If search is entirely special chars, return empty
        return { data: [], count: 0 };
      }

      // Find seller IDs matching the search term
      const { data: matchingSellers } = await supabaseAdmin
        .from('business_accounts')
        .select('id')
        .ilike('business_name', `%${sanitized}%`);

      const sellerIds = matchingSellers?.map(s => s.id) || [];

      if (sellerIds.length > 0) {
        query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,seller_id.in.(${sellerIds.join(',')})`);
      } else {
        query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    } else if (category && category !== 'all') {
       // Note: This assumes category name matches exactly. 
       // Ideally we should filter by ID, but for now we rely on the join or client passing ID.
       // Since we can't easily filter by joined column without !inner, and !inner changes behavior,
       // we'll try to find the category ID first if possible, or use !inner.
       // For safety/performance, let's use !inner if category name is provided.
       // But wait, the select above uses left join for categories.
       // If we want to filter by category name, we must use !inner on the relationship in the filter?
       // Supabase syntax: .eq('categories.name', category) works if we change the select to use !inner
       // But we can't change the select dynamically easily.
       // Let's just fetch all for that category if we can't filter easily? No, that defeats the purpose.
       // Let's try to use the text search on the category name if possible? No.
       // Best approach: The caller should resolve category name to ID.
       // But for backward compatibility, let's try to fetch the category ID for the name first.
       const { data: catData } = await supabaseAdmin
         .from('categories')
         .select('id')
         .ilike('name', category)
         .single();
       
       if (catData) {
         query = query.eq('category_id', catData.id);
       }
    }

    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    // Filter by specific product IDs (for collections like Featured, Best Sellers, etc.)
    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'name_asc':
      default:
        query = query.order('name', { ascending: true });
        break;
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      productLogger.error('Failed to fetch products', error);
      return { data: [], count: 0 };
    }

    // DEBUG: Log raw data
    productLogger.debug('Raw products fetched', { count: data?.length, firstProductImages: data?.[0]?.product_images });

    // Map Supabase data to Product type
    const products = (data || []).map(product => {
      // product_images is an array of URLs directly on the products table
      const productImageUrls = Array.isArray(product.product_images) ? product.product_images : [];

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        imageUrls: product.image_urls || [],
        productImages: productImageUrls,
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
        sellerName: product.business_accounts?.business_name,
      };
    });

    return { data: products, count: count || 0 };
  } catch (error) {
    productLogger.error('Failed to fetch products', error as Error);
    
    // Fallback to mock data if database connection fails (e.g. missing env vars)
    if (process.env.NODE_ENV === 'development') {
      productLogger.warn('Using mock data for products due to error');
      let filtered = [...mockProducts];
      
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.description.toLowerCase().includes(q)
        );
      }
      
      if (categoryId) {
        filtered = filtered.filter(p => p.categoryId === categoryId);
      } else if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      
      if (minPrice !== undefined) filtered = filtered.filter(p => p.price >= minPrice);
      if (maxPrice !== undefined) filtered = filtered.filter(p => p.price <= maxPrice);
      
      // Sort
      if (sortBy === 'price_asc') filtered.sort((a, b) => a.price - b.price);
      else if (sortBy === 'price_desc') filtered.sort((a, b) => b.price - a.price);
      else if (sortBy === 'name_desc') filtered.sort((a, b) => b.name.localeCompare(a.name));
      else filtered.sort((a, b) => a.name.localeCompare(b.name));
      
      const total = filtered.length;
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);
      
      return { data: paged, count: total };
    }

    return { data: [], count: 0 };
  }
}

/**
 * Get all products from Supabase
 * @deprecated Use getProductsPaginated instead for better performance
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
        ),
        business_accounts:seller_id (
          business_name
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
      const images = (Array.isArray(product.product_images) ? product.product_images : []) as DbProductImage[];
      const orderedImageUrls = images
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((img) => img.image_url);

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
        sellerName: product.business_accounts?.business_name,
      };
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    if (process.env.NODE_ENV === 'development') {
      return mockProducts;
    }
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
    const images = (Array.isArray(data.product_images)
      ? data.product_images
      : []) as DbProductImage[];

    const orderedImageUrls = images.length > 0
      ? images
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((img) => img.image_url)
      : (data.image_urls || []);

    // Get boutique slug separately if seller exists
    let boutiqueSlug: string | null = null;
    if (data.seller_id) {
      try {
        const { data: boutique } = await supabaseAdmin
          .from('boutiques')
          .select('slug, is_published')
          .eq('business_account_id', data.seller_id)
          .eq('is_published', true)
          .single();
        
        if (boutique) {
          boutiqueSlug = boutique.slug;
        }
      } catch (e) {
        // Boutique not found or error - that's ok
      }
    }

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
      boutiqueSlug: boutiqueSlug ?? undefined,
    };
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    if (process.env.NODE_ENV === 'development') {
      const product = mockProducts.find(p => p.id === id);
      return product || null;
    }
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
      const images = (Array.isArray(product.product_images) ? product.product_images : []) as DbProductImage[];
      const orderedImageUrls = images
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((img) => img.image_url);

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
    if (process.env.NODE_ENV === 'development') {
      return mockProducts.filter(p => p.sellerId === sellerId || p.sellerId === 'mock-seller-id');
    }
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
    if (process.env.NODE_ENV === 'development') {
      return mockCategories;
    }
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
