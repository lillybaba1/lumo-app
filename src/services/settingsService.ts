
'use server';

import { dbAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

interface Settings {
    currency: string;
}

export async function getSettings(): Promise<Settings | null> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        return { currency: 'USD' };
    }
    try {
        const settingsDocRef = dbAdmin.collection('settings').doc('storeConfig');
        const docSnap = await settingsDocRef.get();
        if (docSnap.exists) {
            return docSnap.data() as Settings;
        }
        return { currency: 'USD' }; // Default currency
    } catch (error) {
        console.error('Failed to get settings from Firestore:', error);
        return { currency: 'USD' };
    }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
         console.error('Failed to save settings. Firebase Admin SDK not initialized.');
         throw new Error('Failed to save settings. Firebase not configured.');
    }
    try {
        const settingsDocRef = dbAdmin.collection('settings').doc('storeConfig');
        await settingsDocRef.set(settings, { merge: true });
    } catch (error) {
         console.error('Failed to save settings to Firestore.', error);
         throw new Error('Failed to save settings. Ensure Firestore is set up correctly.');
    }
}
