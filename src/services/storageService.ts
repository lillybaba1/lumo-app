
'use client';

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

const storageLogger = logger.child('StorageService');

// File upload constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

/**
 * Validates uploaded file meets security requirements
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  // Check file name for security (prevent path traversal)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid file name. File name cannot contain path separators.'
    };
  }

  return { valid: true };
}

/**
 * Uploads an image file to Supabase Storage and returns the public URL.
 * @param file The image file to upload.
 * @param path The path to use for the upload (e.g., 'products/12345').
 * @returns The public URL of the uploaded image.
 */
export async function uploadImageAndGetUrl(file: File, path: string): Promise<string> {
    storageLogger.debug('Uploading file to Supabase', {
        name: file.name,
        size: file.size,
        type: file.type,
        path: path
    });

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
        storageLogger.error('File validation failed', undefined, { error: validation.error });
        throw new Error(validation.error);
    }

    try {
        const supabase = createClient();

        // Generate safe file path with timestamp to prevent caching issues
        const timestamp = Date.now();
        
        // Remove file extension first
        // Note: Using lastDotIndex > 0 (not >= 0) treats files starting with a dot
        // as having no extension, which is appropriate for image uploads
        const lastDotIndex = file.name.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
        const ext = lastDotIndex > 0 ? file.name.substring(lastDotIndex + 1).toLowerCase() : 'jpg';

        // Aggressive sanitization: only keep alphanumeric and single underscores
        const safeName = nameWithoutExt
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')  // Replace any non-alphanumeric with underscore
          .replace(/_+/g, '_')           // Replace multiple underscores with single
          .replace(/^_|_$/g, '')         // Remove leading/trailing underscores
          .substring(0, 50)              // Limit length to 50 chars
          || 'file';                     // Fallback if name becomes empty

        const fileName = `${timestamp}_${safeName}.${ext}`;
        const filePath = `${path}/${fileName}`;

        storageLogger.debug('Uploading to Supabase Storage', { filePath });

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
            });

        if (error) {
            storageLogger.error('Supabase upload error', error);
            throw new Error(`Upload failed: ${error.message}`);
        }

        if (!data?.path) {
            throw new Error('No path returned from Supabase upload');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(data.path);

        storageLogger.info('Upload successful', { publicUrl });

        return publicUrl;

    } catch (error) {
        storageLogger.error('Upload error', error as Error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Upload failed: Network or server error');
    }
}
