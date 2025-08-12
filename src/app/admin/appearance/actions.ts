
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
    const themeToSave: any = {
        primaryColor: formData.get('primaryColor') as string,
        accentColor: formData.get('accentColor') as string,
        backgroundColor: formData.get('backgroundColor') as string,
    }

    const currentBackgroundImage = formData.get('currentBackgroundImage') as string;
    const currentForegroundImage = formData.get('currentForegroundImage') as string;
    
    const newBackgroundImageDataUri = formData.get('backgroundImage') as string;
    const newForegroundImageDataUri = formData.get('foregroundImage') as string;

    // Handle background image
    if (newBackgroundImageDataUri) { // A new image was uploaded
        themeToSave.backgroundImage = await uploadImageAndGetUrl(newBackgroundImageDataUri, 'theme/background');
    } else { // No new image, check if the current one should be kept or removed
        themeToSave.backgroundImage = currentBackgroundImage;
    }

    // Handle foreground image
    if (newForegroundImageDataUri) { // A new image was uploaded
        themeToSave.foregroundImage = await uploadImageAndGetUrl(newForegroundImageDataUri, 'theme/foreground');
    } else { // No new image, check if the current one should be kept or removed
        themeToSave.foregroundImage = currentForegroundImage;
    }


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
    try {
        const theme = await getThemeFromDb();
        // Ensure all default keys are present
        return { ...defaultTheme, ...theme };
    } catch (error) {
        console.error('Failed to read theme:', error);
        return defaultTheme;
    }
}
