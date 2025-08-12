
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Pages } from '@/lib/types';
import * as defaultPagesData from '@/data/pages.json';


const defaultPages: Pages = defaultPagesData;
const pagesDocRef = doc(db, 'content', 'pages');

export async function getPages(): Promise<Pages> {
    try {
        const docSnap = await getDoc(pagesDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as Pages;
        }
        return defaultPages;
    } catch (error) {
        console.warn('Failed to connect to Firestore. Falling back to default pages.', error);
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
