
'use server';

import { saveTheme as saveThemeToDb, getTheme as getThemeFromDb } from '@/services/themeService';
import { revalidatePath } from 'next/cache';

export async function saveTheme(
    formData: FormData
  ): Promise<{ message: string; success: boolean }> {
  try {
    const themeToSave = {
        primaryColor: formData.get('primaryColor') as string,
        accentColor: formData.get('accentColor') as string,
        backgroundColor: formData.get('backgroundColor') as string,
        backgroundImage: formData.get('backgroundImage') as string,
        foregroundImage: formData.get('foregroundImage') as string,
    };

    await saveThemeToDb(themeToSave);
    revalidatePath('/', 'layout');
    revalidatePath('/admin/appearance');

    return { message: 'Theme saved successfully!', success: true };
  } catch (error) {
    console.error('Failed to save theme:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { message: `Failed to save theme settings: ${errorMessage}`, success: false };
  }
}

export async function getTheme() {
    return await getThemeFromDb();
}
