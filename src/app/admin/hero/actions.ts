'use server';

import { revalidatePath } from 'next/cache';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { HeroData } from '@/lib/types';

const HERO_SETTINGS_KEY = 'hero_data';

const defaultHeroData: HeroData = {
  products: [],
  heroLabelText: 'Featured',
  heroLabelPosition: { x: 10, y: 15 },
};

type ValidationResult = { isValid: boolean; errors: string[] };

const validateHeroData = (heroData: HeroData | null): ValidationResult => {
  const errors: string[] = [];

  if (!heroData) {
    return { isValid: false, errors: ['Hero data is required'] };
  }

  if (heroData.heroLabelPosition) {
    const { x, y } = heroData.heroLabelPosition;
    if (!Number.isFinite(x) || x < 0 || x > 100) {
      errors.push('Hero label X position must be between 0 and 100');
    }
    if (!Number.isFinite(y) || y < 0 || y > 100) {
      errors.push('Hero label Y position must be between 0 and 100');
    }
  }

  if (heroData.heroLabelText && heroData.heroLabelText.length > 120) {
    errors.push('Hero label text should be 120 characters or less');
  }

  if (!Array.isArray(heroData.products)) {
    errors.push('Products must be an array');
  } else {
    heroData.products.forEach((product, index) => {
      if (!product?.id || !product?.productId) {
        errors.push(`Product ${index + 1}: missing id or productId`);
      }

      const { position, size } = product;
      if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
        errors.push(`Product ${index + 1}: invalid position`);
      } else {
        if (position.x < 0 || position.x > 100) {
          errors.push(`Product ${index + 1}: position.x must be between 0 and 100`);
        }
        if (position.y < 0 || position.y > 100) {
          errors.push(`Product ${index + 1}: position.y must be between 0 and 100`);
        }
      }

      if (!size || !Number.isFinite(size.width) || !Number.isFinite(size.height)) {
        errors.push(`Product ${index + 1}: invalid size`);
      } else {
        if (size.width <= 0 || size.height <= 0) {
          errors.push(`Product ${index + 1}: size must be positive`);
        }
      }

      if (!Number.isFinite(product.displayOrder)) {
        errors.push(`Product ${index + 1}: displayOrder is required`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
};

export async function getHeroData(): Promise<HeroData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', HERO_SETTINGS_KEY)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return defaultHeroData;
      }
      throw error;
    }

    const savedData = data?.value as HeroData | null;
    if (!savedData) return defaultHeroData;

    return {
      ...defaultHeroData,
      ...savedData,
      heroLabelPosition: {
        x: savedData.heroLabelPosition?.x ?? defaultHeroData.heroLabelPosition!.x,
        y: savedData.heroLabelPosition?.y ?? defaultHeroData.heroLabelPosition!.y,
      },
      products: Array.isArray(savedData.products) ? savedData.products : [],
    };
  } catch (error) {
    console.error('Failed to get hero data:', error);
    return defaultHeroData;
  }
}

export async function saveHeroData(heroData: HeroData): Promise<{ success: boolean; error?: string; details?: string[] }> {
  try {
    const validation = validateHeroData(heroData);
    if (!validation.isValid) {
      return { success: false, error: 'Invalid hero data', details: validation.errors };
    }

    const labelText = typeof heroData.heroLabelText === 'string'
      ? heroData.heroLabelText.trim()
      : undefined;

    const payload: HeroData = {
      ...heroData,
      heroLabelText: labelText ?? defaultHeroData.heroLabelText,
      heroLabelPosition: heroData.heroLabelPosition ?? defaultHeroData.heroLabelPosition,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        {
          key: HERO_SETTINGS_KEY,
          value: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) throw error;

    // Refresh homepage hero cache
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to save hero data:', error);
    return { success: false, error: 'Failed to save hero data.' };
  }
}
