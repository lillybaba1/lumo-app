
'use server';

import { getTheme as getThemeFromDb, saveTheme as saveThemeToDb } from '@/services/themeService';
import { revalidatePath } from 'next/cache';

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "",
  foregroundImage: "",
};

export async function saveTheme(theme: {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage: string;
  foregroundImage: string;
}) {
  try {
    const themeToSave = { ...theme };

    // Don't save large data URIs to firestore
    if (themeToSave.backgroundImage.startsWith('data:image') && themeToSave.backgroundImage.length > 1024) {
        themeToSave.backgroundImage = '';
    }
    if (themeToSave.foregroundImage.startsWith('data:image') && themeToSave.foregroundImage.length > 1024) {
        themeToSave.foregroundImage = '';
    }

    await saveThemeToDb(themeToSave);
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
  } catch (error) {
    console.error('Failed to save theme:', error);
    throw new Error('Failed to save theme settings.');
  }
}

export async function getTheme() {
    try {
        const theme = await getThemeFromDb();
        if (theme) {
            return theme;
        }
        await saveThemeToDb(defaultTheme);
        return defaultTheme;
    } catch (error) {
        console.error('Failed to read theme:', error);
        throw new Error('Failed to read theme settings.');
    }
}
