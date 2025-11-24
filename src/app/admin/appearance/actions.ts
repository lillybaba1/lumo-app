'use server';

import { getSettings, saveSettings } from '@/services/settingsService';
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
