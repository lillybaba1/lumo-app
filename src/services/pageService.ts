
'use server';

import { dbAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';
import { Pages } from '@/lib/types';
import * as defaultPagesData from '@/data/pages.json';

export async function getPages(): Promise<Pages | null> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        return defaultPagesData;
    }
    try {
        const pagesDocRef = dbAdmin.collection('content').doc('pages');
        const docSnap = await pagesDocRef.get();
        if (docSnap.exists) {
            return docSnap.data() as Pages;
        }
        return defaultPagesData;
    } catch (error) {
        console.error('Failed to get pages from Firestore:', error);
        return defaultPagesData;
    }
}

export async function savePages(pages: Pages): Promise<void> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        console.error('Failed to save pages. Firebase Admin SDK not initialized.');
        throw new Error('Failed to save pages. Firebase not configured.');
    }
     try {
        const pagesDocRef = dbAdmin.collection('content').doc('pages');
        await pagesDocRef.set(pages);
    } catch (error) {
         console.error('Failed to save pages to Firestore.', error);
         throw new Error('Failed to save pages. Ensure Firestore is set up correctly.');
    }
}
