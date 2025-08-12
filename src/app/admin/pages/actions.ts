
'use server';

import { getPages as getPagesFromDb, savePages as savePagesToDb } from '@/services/pageService';
import { Pages } from '@/lib/types';
import * as defaultPagesData from '@/data/pages.json';


const defaultPages: Pages = defaultPagesData;

export async function savePages(pages: Pages) {
  try {
    await savePagesToDb(pages);
  } catch (error) {
    console.error('Failed to save pages:', error);
    throw new Error('Failed to save page settings.');
  }
}

export async function getPages(): Promise<Pages> {
    try {
        const pages = await getPagesFromDb();
        return pages && Object.keys(pages).length > 0 ? pages : defaultPages;
    } catch (error) {
        console.error('Failed to read pages:', error);
        return defaultPages;
    }
}
