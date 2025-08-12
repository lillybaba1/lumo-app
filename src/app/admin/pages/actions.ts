
'use server';

import { getPages as getPagesFromDbAdmin, savePages as savePagesToDbAdmin } from '@/services/pageService';
import { Pages } from '@/lib/types';
import * as defaultPagesData from '@/data/pages.json';


export async function savePages(pages: Pages) {
  try {
    await savePagesToDbAdmin(pages);
  } catch (error) {
    console.error('Failed to save pages:', error);
    throw new Error('Failed to save page settings.');
  }
}

export async function getPages(): Promise<Pages | null> {
    try {
        const pages = await getPagesFromDbAdmin();
        return pages;
    } catch (error) {
        console.error('Failed to read pages:', error);
        return null;
    }
}
