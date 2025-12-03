'use client';

import { createClient } from '@/lib/supabase/client';

// File upload constraints for boutique images
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export type BoutiqueImageType = 'logo' | 'banner';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates uploaded file meets requirements for boutique images
 */
function validateBoutiqueImage(file: File, type: BoutiqueImageType): ValidationResult {
  const maxSize = type === 'logo' ? MAX_LOGO_SIZE : MAX_BANNER_SIZE;
  const sizeMB = maxSize / 1024 / 1024;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${sizeMB}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, WebP, and GIF images are allowed',
    };
  }

  // Check file name for security
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid file name',
    };
  }

  return { valid: true };
}

/**
 * Uploads a boutique image (logo or banner) to Supabase Storage
 */
export async function uploadBoutiqueImage(
  file: File,
  businessAccountId: string,
  type: BoutiqueImageType
): Promise<string> {
  console.log(`[BoutiqueStorage] Uploading ${type}:`, {
    name: file.name,
    size: file.size,
    type: file.type,
  });

  // Validate file
  const validation = validateBoutiqueImage(file, type);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const supabase = createClient();

    // Generate safe file path
    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `${type}_${timestamp}.${ext}`;
    const filePath = `${businessAccountId}/${fileName}`;

    console.log(`[BoutiqueStorage] Uploading to path:`, filePath);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('boutique-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Allow replacing existing files
        contentType: file.type,
      });

    if (error) {
      console.error('[BoutiqueStorage] Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error('No path returned from upload');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('boutique-images')
      .getPublicUrl(data.path);

    console.log('[BoutiqueStorage] Upload successful:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('[BoutiqueStorage] Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Upload failed. Please try again.');
  }
}

/**
 * Deletes a boutique image from Supabase Storage
 */
export async function deleteBoutiqueImage(imageUrl: string): Promise<boolean> {
  console.log('[BoutiqueStorage] Deleting image:', imageUrl);

  try {
    const supabase = createClient();

    // Extract the path from the URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/boutique-images/businessId/filename
    const urlParts = imageUrl.split('/boutique-images/');
    if (urlParts.length !== 2) {
      console.warn('[BoutiqueStorage] Invalid image URL format');
      return false;
    }

    const filePath = urlParts[1];
    console.log('[BoutiqueStorage] Deleting path:', filePath);

    const { error } = await supabase.storage
      .from('boutique-images')
      .remove([filePath]);

    if (error) {
      console.error('[BoutiqueStorage] Delete error:', error);
      return false;
    }

    console.log('[BoutiqueStorage] Delete successful');
    return true;
  } catch (error) {
    console.error('[BoutiqueStorage] Delete error:', error);
    return false;
  }
}

/**
 * Get optimal image dimensions for boutique images
 */
export const BOUTIQUE_IMAGE_SPECS = {
  logo: {
    recommended: { width: 400, height: 400 },
    aspectRatio: 1,
    maxSize: '2MB',
    description: 'Square logo, 400x400px recommended',
  },
  banner: {
    recommended: { width: 1200, height: 300 },
    aspectRatio: 4,
    maxSize: '5MB',
    description: 'Wide banner, 1200x300px recommended',
  },
};
