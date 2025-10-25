
'use server';

import { dbAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

export interface Settings {
    // General Store Info
    currency: string;
    storeName?: string;
    storeTagline?: string;
    storeEmail?: string;
    storePhone?: string;
    storeAddress?: string;
    storeLogo?: string;

    // Tax Settings
    taxEnabled?: boolean;
    taxRate?: number;
    taxLabel?: string;
    displayPricesWithTax?: boolean;

    // Shipping Settings
    freeShippingEnabled?: boolean;
    freeShippingThreshold?: number;
    flatRateShippingEnabled?: boolean;
    flatRateShippingCost?: number;

    // Email/Notification Settings
    emailOrderConfirmation?: boolean;
    emailShippingNotification?: boolean;
    emailNewsletter?: boolean;

    // Inventory Settings
    lowStockThreshold?: number;
    enableLowStockAlerts?: boolean;
}

const defaultSettings: Settings = {
    currency: 'USD',
    storeName: 'Lumo Store',
    storeTagline: 'Your trusted e-commerce store',
    taxEnabled: false,
    taxRate: 0,
    taxLabel: 'Tax',
    displayPricesWithTax: false,
    freeShippingEnabled: false,
    freeShippingThreshold: 100,
    flatRateShippingEnabled: false,
    flatRateShippingCost: 10,
    emailOrderConfirmation: true,
    emailShippingNotification: true,
    emailNewsletter: false,
    lowStockThreshold: 10,
    enableLowStockAlerts: true,
};

export async function getSettings(): Promise<Settings> {
    if (!isFirebaseAdminInitialized() || !dbAdmin) {
        return defaultSettings;
    }
    try {
        const settingsDocRef = dbAdmin().collection('settings').doc('storeConfig');
        const docSnap = await settingsDocRef.get();
        if (docSnap.exists) {
            return { ...defaultSettings, ...docSnap.data() } as Settings;
        }
        return defaultSettings;
    } catch (error) {
        console.error('Failed to get settings from Firestore:', error);
        return defaultSettings;
    }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
    if (!isFirebaseAdminInitialized() || !dbAdmin) {
        console.error('Failed to save settings. Firebase Admin SDK not initialized.');
         throw new Error('Failed to save settings. Firebase not configured.');
    }
    try {
       const settingsDocRef = dbAdmin().collection('settings').doc('storeConfig');
       await settingsDocRef.set(settings, { merge: true });
    } catch (error) {
         console.error('Failed to save settings to Firestore.', error);
         throw new Error('Failed to save settings. Ensure Firestore is set up correctly.');
    }
}
