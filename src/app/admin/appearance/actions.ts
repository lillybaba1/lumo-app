
'use server';

import { getTheme as getThemeFromDb, saveTheme as saveThemeToDb } from '@/services/themeService';
import { uploadImageAndGetUrl } from '@/services/storageService';
import { revalidatePath } from 'next/cache';

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "https://placehold.co/1200x800.png",
  foregroundImage: "https://placehold.co/400x400.png",
};

export async function saveTheme(
    prevState: any,
    formData: FormData
  ): Promise<{ message: string; success: boolean }> {
  try {
    const themeToSave = {
        primaryColor: formData.get('primaryColor') as string,
        accentColor: formData.get('accentColor') as string,
        backgroundColor: formData.get('backgroundColor') as string,
        backgroundImage: formData.get('backgroundImage') as string,
        foregroundImage: formData.get('foregroundImage') as string,
    }

    // Check if background image is a new upload (data URI)
    if (themeToSave.backgroundImage.startsWith('data:image')) {
        const backgroundUrl = await uploadImageAndGetUrl(themeToSave.backgroundImage, 'theme/background');
        themeToSave.backgroundImage = backgroundUrl;
    }

    // Check if foreground image is a new upload (data URI)
    if (themeToSave.foregroundImage.startsWith('data:image')) {
        const foregroundUrl = await uploadImageAndGetUrl(themeToSave.foregroundImage, 'theme/foreground');
        themeToSave.foregroundImage = foregroundUrl;
    }

    await saveThemeToDb(themeToSave);
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/admin/appearance');

    return { message: 'Theme saved successfully!', success: true };
  } catch (error) {
    console.error('Failed to save theme:', error);
    return { message: 'Failed to save theme settings.', success: false };
  }
}

export async function getTheme() {
    try {
        const theme = await getThemeFromDb();
        return { ...defaultTheme, ...theme };
    } catch (error) {
        console.error('Failed to read theme:', error);
        return defaultTheme;
    }
}
