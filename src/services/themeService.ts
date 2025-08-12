
'use server';

import { dbAdmin } from '@/lib/firebaseAdmin';

interface Theme {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    backgroundImage: string;
    foregroundImage: string;
}

const themeDocRef = dbAdmin.collection('settings').doc('theme');

export async function getTheme(): Promise<Theme | null> {
    try {
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
    try {
        await themeDocRef.set(theme, { merge: true });
    } catch (error) {
         console.error('Failed to save theme to Firestore.', error);
         throw new Error('Failed to save theme. Ensure Firestore is set up correctly.');
    }
}
