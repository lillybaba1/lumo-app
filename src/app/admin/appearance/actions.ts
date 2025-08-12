
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
    
    const newBackgroundImageFile = formData.get('backgroundImage') as File;
    const newForegroundImageFile = formData.get('foregroundImage') as File;

    if (newBackgroundImageFile && newBackgroundImageFile.size > 0) {
        const bgDataUri = await fileToDataUri(newBackgroundImageFile);
        themeToSave.backgroundImage = await uploadImageAndGetUrl(bgDataUri, 'theme/background');
    } else {
        themeToSave.backgroundImage = currentBackgroundImage;
    }

    if (newForegroundImageFile && newForegroundImageFile.size > 0) {
        const fgDataUri = await fileToDataUri(newForegroundImageFile);
        themeToSave.foregroundImage = await uploadImageAndGetUrl(fgDataUri, 'theme/foreground');
    } else {
        themeToSave.foregroundImage = currentForegroundImage;
    }


    await saveThemeToDb(themeToSave);
    revalidatePath('/', 'layout');
    revalidatePath('/admin/appearance');

    return { message: 'Theme saved successfully!', success: true };
  } catch (error) {
    console.error('Failed to save theme:', error);
    return { message: 'Failed to save theme settings.', success: false };
  }
}

async function fileToDataUri(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${file.type};base64,${buffer.toString('base64')}`;
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
