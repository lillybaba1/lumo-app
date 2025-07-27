'use server';

import fs from 'fs/promises';
import path from 'path';

const pagesFilePath = path.join(process.cwd(), 'src', 'data', 'pages.json');

const defaultPages = {
  about: { title: 'About Us', content: 'Welcome to Lumo! We are passionate about providing the best products and customer service.' },
  shipping: { title: 'Shipping Policy', content: 'We offer free shipping on all orders over $50. Orders are typically processed within 2-3 business days.' },
  contact: { title: 'Contact Us', content: 'Have questions? Email us at support@lumo.com or call us at (123) 456-7890.' },
  faq: { title: 'FAQ', content: 'Q: How do I return an item? A: Please contact our support team for a return authorization.' },
  policy: { title: 'Return Policy', content: 'We accept returns within 30 days of purchase for a full refund.' },
};

type Pages = typeof defaultPages;

export async function savePages(pages: Pages) {
  try {
    await fs.writeFile(pagesFilePath, JSON.stringify(pages, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save pages:', error);
    throw new Error('Failed to save page settings.');
  }
}

export async function getPages(): Promise<Pages> {
    try {
        await fs.access(pagesFilePath);
        const pagesData = await fs.readFile(pagesFilePath, 'utf-8');
        return JSON.parse(pagesData);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            // File doesn't exist, create it with default content
            try {
                await savePages(defaultPages);
                return defaultPages;
            } catch (saveError) {
                 console.error('Failed to create default pages file:', saveError);
                 throw new Error('Failed to create default page settings.');
            }
        }
        console.error('Failed to read pages:', error);
        throw new Error('Failed to read page settings.');
    }
}
