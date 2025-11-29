'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { HeroData } from '@/lib/types';
import { z } from 'zod';
import { getSettings, saveSettings } from '@/services/settingsService';

const heroProductSchema = z.object({
  id: z.string(),
  productId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
  displayOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

const heroDataSchema = z.object({
  products: z.array(heroProductSchema),
  heroLabelText: z.string().optional(),
  heroLabelPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  backgroundImageUrl: z.string().optional(),
  updatedAt: z.string().optional(),
});

export async function getHeroData(): Promise<HeroData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'hero_products')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return default
        return {
          products: [],
          heroLabelText: 'Featured',
          heroLabelPosition: { x: 10, y: 15 }
        };
      }
      throw error;
    }

    const value = data?.value as HeroData | undefined;
    return value || { products: [], heroLabelText: 'Featured', heroLabelPosition: { x: 10, y: 15 } };
  } catch (error) {
    console.error('Failed to get hero data:', error);
    return { products: [], heroLabelText: 'Featured', heroLabelPosition: { x: 10, y: 15 } };
  }
}

export async function saveHeroData(heroData: HeroData & { backgroundImageUrl?: string }) {
  try {
    console.log('Saving hero data:', JSON.stringify(heroData, null, 2));

    // Validate incoming data
    const parsed = heroDataSchema.safeParse(heroData);
    if (!parsed.success) {
      console.error('Hero save validation failed:', parsed.error.flatten());
      return { success: false, error: 'Invalid hero data', details: parsed.error.flatten() };
    }

    // Ensure referenced products actually exist; drop any invalid ones to avoid DB errors
    const productIds = parsed.data.products.map(p => p.productId);
    let validIds: Set<string> | null = null;
    if (productIds.length > 0) {
      const { data: existingProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id')
        .in('id', productIds);

      if (productsError) {
        console.error('Hero save product validation error:', productsError);
        return { success: false, error: 'Database error validating products' };
      }

      validIds = new Set((existingProducts || []).map(p => p.id));
    }

    const filteredProducts = validIds
      ? parsed.data.products.filter(p => validIds!.has(p.productId))
      : parsed.data.products;

    // Save background image to settings if provided
    if (parsed.data.backgroundImageUrl) {
      const currentSettings = await getSettings();
      await saveSettings({
        ...currentSettings,
        heroBackgroundImage: parsed.data.backgroundImageUrl,
      });
    }

    const payload = {
      ...parsed.data,
      products: filteredProducts,
      heroLabelText: parsed.data.heroLabelText || 'Featured',
      heroLabelPosition: parsed.data.heroLabelPosition || { x: 10, y: 15 },
      updatedAt: new Date().toISOString(),
    };
    // Remove backgroundImageUrl from payload as it's stored in settings
    delete (payload as any).backgroundImageUrl;

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'hero_products',
        value: payload
      });

    if (error) {
      console.error('Supabase error saving hero data:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to save hero data:', error);
    return { success: false, error: 'Failed to save hero data. Please try again.' };
  }
}
