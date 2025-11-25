import { describe, it, expect } from 'vitest';

/**
 * Test helper function that mimics the filename sanitization logic
 * This should match the implementation in storageService.ts
 */
function sanitizeFileName(fileName: string, timestamp: number): string {
  // Remove file extension first
  // Note: Using lastDotIndex > 0 (not >= 0) treats files starting with a dot
  // as having no extension, which is appropriate for image uploads
  const lastDotIndex = fileName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1).toLowerCase() : 'jpg';

  // Aggressive sanitization: only keep alphanumeric and single underscores
  const safeName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')  // Replace any non-alphanumeric with underscore
    .replace(/_+/g, '_')           // Replace multiple underscores with single
    .replace(/^_|_$/g, '')         // Remove leading/trailing underscores
    .substring(0, 50)              // Limit length to 50 chars
    || 'file';                     // Fallback if name becomes empty

  return `${timestamp}_${safeName}.${ext}`;
}

describe('Storage Service - Filename Sanitization', () => {
  const testTimestamp = 1764111353087;

  describe('sanitizeFileName', () => {
    it('should handle filename with special Unicode characters (DALL·E)', () => {
      const input = 'DALL·E 2025-6-22 13.43.29 - A_photorealistic_image.webp';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_dall_e_2025_6_22_13_43_29_a_photorealistic_image.webp');
    });

    it('should handle filename with colons', () => {
      const input = 'file:with:colons.png';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_file_with_colons.png');
    });

    it('should handle filename with spaces', () => {
      const input = 'file with many   spaces.jpg';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_file_with_many_spaces.jpg');
    });

    it('should handle filename with dashes', () => {
      const input = 'file-with-dashes.jpeg';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_file_with_dashes.jpeg');
    });

    it('should handle filename with dots in the name', () => {
      const input = 'file.name.with.dots.png';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_file_name_with_dots.png');
    });

    it('should handle filename with mixed special characters', () => {
      const input = 'Product#123@Special!Chars&Name.gif';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_product_123_special_chars_name.gif');
    });

    it('should convert to lowercase', () => {
      const input = 'UPPERCASE_FILENAME.PNG';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_uppercase_filename.png');
    });

    it('should remove leading and trailing underscores', () => {
      const input = '__leading_and_trailing__.jpg';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_leading_and_trailing.jpg');
    });

    it('should collapse multiple underscores into one', () => {
      const input = 'multiple___underscores.jpg';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_multiple_underscores.jpg');
    });

    it('should handle very long filenames', () => {
      const input = 'a'.repeat(100) + '.jpg';
      const result = sanitizeFileName(input, testTimestamp);
      // Should be limited to 50 chars for the name part
      const expectedMaxLength = testTimestamp.toString().length + 1 + 50 + 1 + 3; // timestamp + _ + name(50) + . + ext(3)
      expect(result.length).toBeLessThanOrEqual(expectedMaxLength);
      expect(result).toMatch(/^1764111353087_a{50}\.jpg$/);
    });

    it('should handle filename with only special characters', () => {
      const input = '!@#$%^&*().png';
      const result = sanitizeFileName(input, testTimestamp);
      // Should result in fallback name when safeName is empty
      expect(result).toBe('1764111353087_file.png');
    });

    it('should preserve correct file extension', () => {
      const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      extensions.forEach(ext => {
        const input = `test_file.${ext}`;
        const result = sanitizeFileName(input, testTimestamp);
        expect(result).toBe(`1764111353087_test_file.${ext}`);
      });
    });

    it('should handle uppercase file extensions', () => {
      const input = 'test_file.WEBP';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_test_file.webp');
    });

    it('should handle filename without extension', () => {
      const input = 'filename_no_extension';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_filename_no_extension.jpg');
    });

    it('should handle emoji and complex Unicode characters', () => {
      const input = 'test_🚀_emoji_文字.jpg';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_test_emoji.jpg');
    });

    it('should handle commas and periods', () => {
      const input = 'test,file.name,with.commas.png';
      const result = sanitizeFileName(input, testTimestamp);
      expect(result).toBe('1764111353087_test_file_name_with_commas.png');
    });

    it('should produce URL-safe filenames', () => {
      const input = 'test file#with%many&special*chars!.jpg';
      const result = sanitizeFileName(input, testTimestamp);
      // Should only contain alphanumeric, underscores, dots, and the dash from timestamp
      expect(result).toMatch(/^[0-9]+_[a-z0-9_]+\.[a-z]+$/);
    });

    it('should handle filename starting with dot (treats entire name as filename)', () => {
      const input = '.htaccess';
      const result = sanitizeFileName(input, testTimestamp);
      // Files starting with dot are treated as having no extension
      expect(result).toBe('1764111353087_htaccess.jpg');
    });
  });
});
