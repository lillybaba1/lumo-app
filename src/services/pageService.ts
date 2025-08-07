
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Pages } from '@/lib/types';

const pagesDocRef = doc(db, 'content', 'pages');

const defaultPages: Pages = {
  about: { title: 'About Us', content: 'Welcome to Lumo! We are passionate about providing the best products and customer service.' },
  shipping: { title: 'Shipping Policy', content: 'We offer free shipping on all orders over $50. Orders are typically processed within 2-3 business days.' },
  contact: { title: 'Contact Us', content: 'Have questions? Email us at support@lumo.com or call us at (123) 456-7890.' },
  faq: { title: 'FAQ', content: 'Q: How do I return an item? A: Please contact our support team for a return authorization.' },
  policy: { title: 'Return Policy', content: 'We accept returns within 30 days of purchase for a full refund.' },
};

export async function getPages(): Promise<Pages> {
    try {
        const docSnap = await getDoc(pagesDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as Pages;
        }
        // If the document doesn't exist, create it with default data.
        await setDoc(pagesDocRef, defaultPages);
        return defaultPages;
    } catch (error) {
        console.warn('Failed to connect to Firestore. Falling back to default pages.', error);
        // Fallback for when Firestore is not available (e.g., offline, not set up)
        return defaultPages;
    }
}

export async function savePages(pages: Pages): Promise<void> {
     try {
        await setDoc(pagesDocRef, pages);
    } catch (error) {
         console.error('Failed to save pages to Firestore.', error);
         throw new Error('Failed to save pages. Ensure Firestore is set up correctly.');
    }
}
