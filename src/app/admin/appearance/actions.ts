
'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const themeFilePath = path.join(process.cwd(), 'src', 'data', 'theme.json');

export async function saveTheme(theme: {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage: string;
  foregroundImage: string;
}) {
  try {
    await fs.writeFile(themeFilePath, JSON.stringify(theme, null, 2), 'utf-8');
    // Also update globals.css if needed, for now we just save to json
    // This part would be more complex, involving CSS variable generation
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to save theme:', error);
    throw new Error('Failed to save theme settings.');
  }
}

export async function getTheme() {
    try {
        const themeData = await fs.readFile(themeFilePath, 'utf-8');
        return JSON.parse(themeData);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            // Return default theme if file doesn't exist
            return {
              primaryColor: "#D0BFFF",
              accentColor: "#FFB3C6",
              backgroundColor: "#E8E2FF",
              backgroundImage: "",
              foregroundImage: "",
            };
        }
        console.error('Failed to read theme:', error);
        throw new Error('Failed to read theme settings.');
    }
}
