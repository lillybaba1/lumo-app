'use server';

import { getSettings, saveSettings } from '@/services/settingsService';
import type { Settings } from '@/services/settingsService';
import { isValidTheme } from '@/lib/themes';
import { revalidatePath } from 'next/cache';

/**
 * Get the currently active theme
 */
export async function getActiveTheme(): Promise<string> {
  const settings = await getSettings();
  return settings.theme || 'minimal-light';
}

/**
 * Update the active theme
 */
export async function updateTheme(themeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate theme exists
    if (!isValidTheme(themeId)) {
      return { success: false, error: 'Invalid theme selected' };
    }

    // Get current settings
    const currentSettings = await getSettings();

    // Update with new theme
    await saveSettings({
      ...currentSettings,
      theme: themeId,
    });

    // Revalidate all pages to apply new theme
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Failed to update theme:', error);
    return { success: false, error: 'Failed to save theme. Please try again.' };
  }
}

/**
 * Get hero settings
 */
export async function getHeroSettings(): Promise<{
  heroHeading: string;
  heroTagline: string;
  heroBackgroundImage: string;
  heroImageObjectPosition: string;
}> {
  const settings = await getSettings();
  return {
    heroHeading: settings.heroHeading || 'Step into Lumo',
    heroTagline: settings.heroTagline || 'Discover exceptional products crafted with care. Your journey to quality starts here.',
    heroBackgroundImage: settings.heroBackgroundImage || '',
    heroImageObjectPosition: settings.heroImageObjectPosition || 'center',
  };
}

/**
 * Update hero settings
 */
export async function updateHeroSettings(heroData: {
  heroHeading: string;
  heroTagline: string;
  heroBackgroundImage: string;
  heroImageObjectPosition: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const currentSettings = await getSettings();

    // Delete old hero image from storage if it's being replaced
    const oldHeroImage = currentSettings.heroBackgroundImage;
    if (oldHeroImage &&
        oldHeroImage !== heroData.heroBackgroundImage &&
        oldHeroImage.includes('supabase.co/storage')) {

      try {
        // Extract filename from URL
        const urlParts = oldHeroImage.split('/');
        const filename = urlParts[urlParts.length - 1].split('?')[0];

        // Delete from Supabase storage
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase.storage
          .from('product-images')
          .remove([`hero/${filename}`]);

        console.log(`Deleted old hero image: ${filename}`);
      } catch (deleteError) {
        console.error('Failed to delete old hero image:', deleteError);
        // Continue anyway - don't block the update
      }
    }

    await saveSettings({
      ...currentSettings,
      heroHeading: heroData.heroHeading,
      heroTagline: heroData.heroTagline,
      heroBackgroundImage: heroData.heroBackgroundImage,
      heroImageObjectPosition: heroData.heroImageObjectPosition,
    });

    // Revalidate ALL pages to force refresh
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Failed to update hero settings:', error);
    return { success: false, error: 'Failed to save hero settings. Please try again.' };
  }
}
