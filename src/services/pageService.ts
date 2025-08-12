
'use server';

import { dbAdmin } from '@/lib/firebaseAdmin';
import { Pages } from '@/lib/types';

const pagesDocRef = dbAdmin.collection('content').doc('pages');

export async function getPages(): Promise<Pages | null> {
    try {
        const docSnap = await pagesDocRef.get();
        if (docSnap.exists) {
            return docSnap.data() as Pages;
        }
        return null;
    } catch (error) {
        console.error('Failed to get pages from Firestore:', error);
        return null;
    }
}

export async function savePages(pages: Pages): Promise<void> {
     try {
        await pagesDocRef.set(pages);
    } catch (error) {
         console.error('Failed to save pages to Firestore.', error);
         throw new Error('Failed to save pages. Ensure Firestore is set up correctly.');
    }
}
