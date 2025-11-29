'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { HeroData } from '@/lib/types';
import { z } from 'zod';

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

export async function saveHeroData(heroData: HeroData) {
  try {
    // Validate incoming data
    const parsed = heroDataSchema.safeParse(heroData);
    if (!parsed.success) {
      console.error('Hero save validation failed:', parsed.error.flatten());
      throw new Error('VALIDATION_ERROR');
    }

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'hero_products',
        value: {
          ...heroData,
          updatedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    if (error instanceof Error && error.message === 'VALIDATION_ERROR') {
      throw error;
    }
    console.error('Failed to save hero data:', error);
    throw new Error('Failed to save hero data.');
  }
}
