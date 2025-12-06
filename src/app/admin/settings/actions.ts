
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

        // Footer Settings
        footerDescription: formData.get('footerDescription') as string || undefined,
        footerCopyright: formData.get('footerCopyright') as string || undefined,
        footerTagline: formData.get('footerTagline') as string || undefined,
        footerEmail: formData.get('footerEmail') as string || undefined,
        footerPhone: formData.get('footerPhone') as string || undefined,
        footerWhatsApp: formData.get('footerWhatsApp') as string || undefined,

        // Social Media
        socialFacebook: formData.get('socialFacebook') as string || undefined,
        socialInstagram: formData.get('socialInstagram') as string || undefined,
        socialX: formData.get('socialX') as string || undefined,
        socialTiktok: formData.get('socialTiktok') as string || undefined,
        socialYoutube: formData.get('socialYoutube') as string || undefined,

        // Trust Badges
        trustBadge1Title: formData.get('trustBadge1Title') as string || undefined,
        trustBadge1Subtitle: formData.get('trustBadge1Subtitle') as string || undefined,
        trustBadge2Title: formData.get('trustBadge2Title') as string || undefined,
        trustBadge2Subtitle: formData.get('trustBadge2Subtitle') as string || undefined,
        trustBadge3Title: formData.get('trustBadge3Title') as string || undefined,
        trustBadge3Subtitle: formData.get('trustBadge3Subtitle') as string || undefined,
        trustBadge4Title: formData.get('trustBadge4Title') as string || undefined,
        trustBadge4Subtitle: formData.get('trustBadge4Subtitle') as string || undefined,
        trustBadge5Title: formData.get('trustBadge5Title') as string || undefined,
        trustBadge5Subtitle: formData.get('trustBadge5Subtitle') as string || undefined,

        // Payment & Delivery
        footerPaymentMethods: formData.get('footerPaymentMethods') as string || undefined,
        footerDeliveryCountries: formData.get('footerDeliveryCountries') as string || undefined,
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
