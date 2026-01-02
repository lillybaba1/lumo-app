"use server";

import { logger } from '@/lib/logger';

const productimageLogger = logger.child('ProductImageService');

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ProductImage, ProductAttribute, ProductVariant } from '@/lib/types';

/**
 * Get all images for a product
 */
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order');

    if (error) {
      productimageLogger.error(`Failed to fetch images for product ${productId}:`, error);
      return [];
    }

    return (data || []).map(img => ({
      id: img.id,
      productId: img.product_id,
      imageUrl: img.image_url,
      imageType: img.image_type,
      cropX: img.crop_x,
      cropY: img.crop_y,
      cropWidth: img.crop_width,
      cropHeight: img.crop_height,
      displayOrder: img.display_order,
      isPrimary: img.is_primary,
      altText: img.alt_text,
      createdAt: img.created_at,
      updatedAt: img.updated_at,
    }));
  } catch (error) {
    productimageLogger.error(`Failed to fetch images for product ${productId}:`, error);
    return [];
  }
}

/**
 * Add or update product image with crop data
 */
export async function saveProductImage(image: Omit<ProductImage, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ProductImage | null> {
  try {
    const imageData = {
      product_id: image.productId,
      image_url: image.imageUrl,
      image_type: image.imageType,
      crop_x: image.cropX,
      crop_y: image.cropY,
      crop_width: image.cropWidth,
      crop_height: image.cropHeight,
      display_order: image.displayOrder,
      is_primary: image.isPrimary,
      alt_text: image.altText,
    };

    let result;
    if (image.id) {
      // Update existing
      result = await supabaseAdmin
        .from('product_images')
        .update(imageData)
        .eq('id', image.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabaseAdmin
        .from('product_images')
        .insert(imageData)
        .select()
        .single();
    }

    if (result.error) {
      productimageLogger.error('Failed to save product image:', result.error);
      return null;
    }

    const saved = result.data;
    return {
      id: saved.id,
      productId: saved.product_id,
      imageUrl: saved.image_url,
      imageType: saved.image_type,
      cropX: saved.crop_x,
      cropY: saved.crop_y,
      cropWidth: saved.crop_width,
      cropHeight: saved.crop_height,
      displayOrder: saved.display_order,
      isPrimary: saved.is_primary,
      altText: saved.alt_text,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  } catch (error) {
    productimageLogger.error('Failed to save product image:', error);
    return null;
  }
}

/**
 * Delete a product image
 */
export async function deleteProductImage(imageId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      productimageLogger.error('Failed to delete product image:', error);
      return false;
    }

    return true;
  } catch (error) {
    productimageLogger.error('Failed to delete product image:', error);
    return false;
  }
}

/**
 * Get all attributes for a product
 */
export async function getProductAttributes(productId: string): Promise<ProductAttribute[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_attributes')
      .select('*')
      .eq('product_id', productId)
      .order('display_order');

    if (error) {
      productimageLogger.error(`Failed to fetch attributes for product ${productId}:`, error);
      return [];
    }

    return (data || []).map(attr => ({
      id: attr.id,
      productId: attr.product_id,
      attributeName: attr.attribute_name,
      attributeValue: attr.attribute_value,
      attributeGroup: attr.attribute_group,
      displayOrder: attr.display_order,
      isVariant: attr.is_variant,
      priceModifier: attr.price_modifier ? parseFloat(attr.price_modifier) : undefined,
      stockModifier: attr.stock_modifier,
      createdAt: attr.created_at,
      updatedAt: attr.updated_at,
    }));
  } catch (error) {
    productimageLogger.error(`Failed to fetch attributes for product ${productId}:`, error);
    return [];
  }
}

/**
 * Save product attribute
 */
export async function saveProductAttribute(attribute: Omit<ProductAttribute, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ProductAttribute | null> {
  try {
    const attrData = {
      product_id: attribute.productId,
      attribute_name: attribute.attributeName,
      attribute_value: attribute.attributeValue,
      attribute_group: attribute.attributeGroup,
      display_order: attribute.displayOrder,
      is_variant: attribute.isVariant,
      price_modifier: attribute.priceModifier,
      stock_modifier: attribute.stockModifier,
    };

    let result;
    if (attribute.id) {
      result = await supabaseAdmin
        .from('product_attributes')
        .update(attrData)
        .eq('id', attribute.id)
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from('product_attributes')
        .insert(attrData)
        .select()
        .single();
    }

    if (result.error) {
      productimageLogger.error('Failed to save product attribute:', result.error);
      return null;
    }

    const saved = result.data;
    return {
      id: saved.id,
      productId: saved.product_id,
      attributeName: saved.attribute_name,
      attributeValue: saved.attribute_value,
      attributeGroup: saved.attribute_group,
      displayOrder: saved.display_order,
      isVariant: saved.is_variant,
      priceModifier: saved.price_modifier ? parseFloat(saved.price_modifier) : undefined,
      stockModifier: saved.stock_modifier,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  } catch (error) {
    productimageLogger.error('Failed to save product attribute:', error);
    return null;
  }
}

/**
 * Delete product attribute
 */
export async function deleteProductAttribute(attributeId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('product_attributes')
      .delete()
      .eq('id', attributeId);

    if (error) {
      productimageLogger.error('Failed to delete product attribute:', error);
      return false;
    }

    return true;
  } catch (error) {
    productimageLogger.error('Failed to delete product attribute:', error);
    return false;
  }
}

/**
 * Get all variants for a product
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);

    if (error) {
      productimageLogger.error(`Failed to fetch variants for product ${productId}:`, error);
      return [];
    }

    return (data || []).map(variant => ({
      id: variant.id,
      productId: variant.product_id,
      variantName: variant.variant_name,
      sku: variant.sku,
      priceModifier: parseFloat(variant.price_modifier),
      stock: variant.stock,
      attributes: variant.attributes,
      imageUrl: variant.image_url,
      isActive: variant.is_active,
      createdAt: variant.created_at,
      updatedAt: variant.updated_at,
    }));
  } catch (error) {
    productimageLogger.error(`Failed to fetch variants for product ${productId}:`, error);
    return [];
  }
}

