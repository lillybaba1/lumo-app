
'use server';

import { saveSettings as saveSettingsToDb, getSettings as getSettingsFromDb, Settings } from '@/services/settingsService';
import { revalidatePath } from 'next/cache';

export async function saveSettings(
    formData: FormData
  ): Promise<{ message: string; success: boolean }> {
  try {
    const settingsToSave: Partial<Settings> = {
        // General
        currency: formData.get('currency') as string,
        storeName: formData.get('storeName') as string || undefined,
        storeTagline: formData.get('storeTagline') as string || undefined,
        storeEmail: formData.get('storeEmail') as string || undefined,
        storePhone: formData.get('storePhone') as string || undefined,
        storeAddress: formData.get('storeAddress') as string || undefined,
        storeLogo: formData.get('storeLogo') as string || undefined,

        // Tax
        taxEnabled: formData.get('taxEnabled') === 'true',
        taxRate: parseFloat(formData.get('taxRate') as string) || 0,
        taxLabel: formData.get('taxLabel') as string || 'Tax',
        displayPricesWithTax: formData.get('displayPricesWithTax') === 'true',

        // Shipping
        freeShippingEnabled: formData.get('freeShippingEnabled') === 'true',
        freeShippingThreshold: parseFloat(formData.get('freeShippingThreshold') as string) || 0,
        flatRateShippingEnabled: formData.get('flatRateShippingEnabled') === 'true',
        flatRateShippingCost: parseFloat(formData.get('flatRateShippingCost') as string) || 0,

        // Email/Notifications
        emailOrderConfirmation: formData.get('emailOrderConfirmation') === 'true',
        emailShippingNotification: formData.get('emailShippingNotification') === 'true',
        emailNewsletter: formData.get('emailNewsletter') === 'true',

        // Inventory
        lowStockThreshold: parseInt(formData.get('lowStockThreshold') as string) || 10,
        enableLowStockAlerts: formData.get('enableLowStockAlerts') === 'true',
    };

    await saveSettingsToDb(settingsToSave);

    // Revalidate all pages to reflect changes
    revalidatePath('/', 'layout');

    return { message: 'Settings saved successfully!', success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { message: `Failed to save settings: ${errorMessage}`, success: false };
  }
}

export async function getSettings() {
    return await getSettingsFromDb();
}
