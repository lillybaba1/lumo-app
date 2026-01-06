/**
 * Image Optimization Utilities
 * 
 * Provides blur placeholders, optimized loading strategies, and CDN helpers
 * for better image loading performance.
 */

/**
 * Generate a tiny SVG blur placeholder (data URL)
 * This creates an instant blurred preview while the real image loads
 */
export function generateBlurPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#e5e7eb'
): string {
  // Create a simple SVG with a gradient background
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1"/>
      </filter>
      <rect width="100%" height="100%" fill="${color}" filter="url(#b)"/>
    </svg>
  `.trim().replace(/\s+/g, ' ');
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Default blur data URL for product images
 * A neutral gray that works well with most product photos
 */
export const PRODUCT_BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PGZpbHRlciBpZD0iYiIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIgZmlsdGVyPSJ1cmwoI2IpIi8+PC9zdmc+';

/**
 * Default blur data URL for hero/banner images
 * Slightly darker for better contrast
 */
export const HERO_BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PGZpbHRlciBpZD0iYiIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzNhM2E0YSIgZmlsdGVyPSJ1cmwoI2IpIi8+PC9zdmc+';

/**
 * Default blur data URL for category images
 */
export const CATEGORY_BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PGZpbHRlciBpZD0iYiIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VhZWFlYSIgZmlsdGVyPSJ1cmwoI2IpIi8+PC9zdmc+';

/**
 * Optimized image URL for Supabase storage
 * Adds proper cache headers and optional transform parameters
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  if (!url) return '';
  
  // Handle Supabase storage URLs
  if (url.includes('supabase.co/storage')) {
    const urlObj = new URL(url);
    
    // Add transform parameters if Supabase Image Transformation is enabled
    if (options?.width) {
      urlObj.searchParams.set('width', options.width.toString());
    }
    if (options?.height) {
      urlObj.searchParams.set('height', options.height.toString());
    }
    if (options?.quality) {
      urlObj.searchParams.set('quality', options.quality.toString());
    }
    
    return urlObj.toString();
  }
  
  return url;
}

/**
 * Get sizes attribute based on common layout patterns
 */
export const IMAGE_SIZES = {
  // Product grid (4 columns desktop, 2 mobile)
  productGrid: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  // Hero banner
  hero: '100vw',
  // Product detail main image
  productDetail: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px',
  // Thumbnail
  thumbnail: '80px',
  // Category card
  category: '(max-width: 640px) 25vw, 120px',
  // Cart/checkout item
  cartItem: '80px',
  // Avatar
  avatar: '40px',
} as const;

/**
 * Check if an image should be loaded with priority (above the fold)
 * @param index - Position in the list
 * @param threshold - How many items are considered "above the fold"
 */
export function shouldPrioritize(index: number, threshold: number = 4): boolean {
  return index < threshold;
}

/**
 * Get loading strategy based on position
 */
export function getLoadingStrategy(index: number, threshold: number = 4): 'eager' | 'lazy' {
  return index < threshold ? 'eager' : 'lazy';
}
