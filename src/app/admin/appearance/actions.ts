
'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const dataDir = path.join(process.cwd(), 'src', 'data');
const themeFilePath = path.join(dataDir, 'theme.json');

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "",
  foregroundImage: "",
};

async function ensureDataDirExists() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

export async function saveTheme(theme: {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage: string;
  foregroundImage: string;
}) {
  try {
    await ensureDataDirExists();
    await fs.writeFile(themeFilePath, JSON.stringify(theme, null, 2), 'utf-8');
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
  } catch (error) {
    console.error('Failed to save theme:', error);
    throw new Error('Failed to save theme settings.');
  }
}

export async function getTheme() {
    try {
        await fs.access(themeFilePath);
        const themeData = await fs.readFile(themeFilePath, 'utf-8');
        return JSON.parse(themeData);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            try {
                await saveTheme(defaultTheme);
                return defaultTheme;
            } catch (saveError) {
                 console.error('Failed to create default theme file:', saveError);
                 throw new Error('Failed to create default theme settings.');
            }
        }
        console.error('Failed to read theme:', error);
        throw new Error('Failed to read theme settings.');
    }
}
