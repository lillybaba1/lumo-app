
'use server';

import { dbAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

interface Theme {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    backgroundImage: string;
    foregroundImage: string;
    foregroundImageScale?: number;
    foregroundImagePositionX?: number;
    foregroundImagePositionY?: number;
    updatedAt?: string;
}

export async function getTheme(): Promise<Theme | null> {
    if (!isFirebaseAdminInitialized() || !dbAdmin) {
        return null;
    }
    try {
        const themeDocRef = dbAdmin().collection('settings').doc('theme');
        const docSnap = await themeDocRef.get();
        if (docSnap.exists) {
            return docSnap.data() as Theme;
        }
        return null;
    } catch (error) {
        console.error('Failed to get theme from Firestore:', error);
        return null;
    }
}

export async function saveTheme(theme: Partial<Theme>): Promise<void> {
    if (!isFirebaseAdminInitialized() || !dbAdmin) {
        console.error('Failed to save theme. Firebase Admin SDK not initialized.');
        throw new Error('Failed to save theme. Firebase not configured.');
    }
    try {
       const themeDocRef = dbAdmin().collection('settings').doc('theme');
       const themeWithTimestamp = {
           ...theme,
           updatedAt: new Date().toISOString()
       };
       await themeDocRef.set(themeWithTimestamp, { merge: true });
    } catch (error) {
         console.error('Failed to save theme to Firestore.', error);
         throw new Error('Failed to save theme. Ensure Firestore is set up correctly.');
    }
}
