
'use server';

import { getPages as getPagesFromDbAdmin, savePages as savePagesToDbAdmin } from '@/services/pageService';
import { Pages, PageContent } from '@/lib/types';
import * as defaultPagesData from '@/data/pages.json';


export async function savePages(pages: Pages) {
  try {
    await savePagesToDbAdmin(pages);
  } catch (error) {
    console.error('Failed to save pages:', error);
    throw new Error('Failed to save page settings.');
  }
}

export async function savePage(slug: string, pageData: PageContent) {
  try {
    const pages = await getPagesFromDbAdmin() || {};
    pages[slug] = {
      ...pageData,
      updatedAt: new Date().toISOString()
    };
    await savePagesToDbAdmin(pages);
  } catch (error) {
    console.error('Failed to save page:', error);
    throw new Error('Failed to save page.');
  }
}

export async function deletePage(slug: string) {
  try {
    const pages = await getPagesFromDbAdmin() || {};
    delete pages[slug];
    await savePagesToDbAdmin(pages);
  } catch (error) {
    console.error('Failed to delete page:', error);
    throw new Error('Failed to delete page.');
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
