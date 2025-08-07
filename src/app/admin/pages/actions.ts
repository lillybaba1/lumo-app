
'use server';

import { getPages as getPagesFromDb, savePages as savePagesToDb } from '@/services/pageService';
import { Pages } from '@/lib/types';

const defaultPages: Pages = {
  about: { title: 'About Us', content: 'Welcome to Lumo! We are passionate about providing the best products and customer service.' },
  shipping: { title: 'Shipping Policy', content: 'We offer free shipping on all orders over $50. Orders are typically processed within 2-3 business days.' },
  contact: { title: 'Contact Us', content: 'Have questions? Email us at support@lumo.com or call us at (123) 456-7890.' },
  faq: { title: 'FAQ', content: 'Q: How do I return an item? A: Please contact our support team for a return authorization.' },
  policy: { title: 'Return Policy', content: 'We accept returns within 30 days of purchase for a full refund.' },
};

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
        throw new Error('Failed to read page settings.');
    }
}
