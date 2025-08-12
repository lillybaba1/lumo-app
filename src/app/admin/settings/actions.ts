
'use server';

import { saveSettings as saveSettingsToDb, getSettings as getSettingsFromDb } from '@/services/settingsService';
import { revalidatePath } from 'next/cache';

export async function saveSettings(
    formData: FormData
  ): Promise<{ message: string; success: boolean }> {
  try {
    const settingsToSave = {
        currency: formData.get('currency') as string,
    };

    await saveSettingsToDb(settingsToSave);
    
    // Revalidate all pages to reflect currency changes
    revalidatePath('/', 'layout');

    return { message: 'Settings saved successfully!', success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { message: `Failed to save settings: ${errorMessage}`, success: false };
  }
}

export async function getSettings() {
    return await getSettingsFromDb();
}
