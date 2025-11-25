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
    heroBackgroundImage: settings.heroBackgroundImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
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

    await saveSettings({
      ...currentSettings,
      heroHeading: heroData.heroHeading,
      heroTagline: heroData.heroTagline,
      heroBackgroundImage: heroData.heroBackgroundImage,
      heroImageObjectPosition: heroData.heroImageObjectPosition,
    });

    // Revalidate homepage to show new hero
    revalidatePath('/', 'page');

    return { success: true };
  } catch (error) {
    console.error('Failed to update hero settings:', error);
    return { success: false, error: 'Failed to save hero settings. Please try again.' };
  }
}
