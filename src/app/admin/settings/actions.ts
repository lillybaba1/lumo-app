
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

        // JulaZone Promise Section
        lumoPromiseEnabled: formData.get('lumoPromiseEnabled') === 'true',
        lumoPromiseTitle: formData.get('lumoPromiseTitle') as string || undefined,
        lumoPromiseDescription: formData.get('lumoPromiseDescription') as string || undefined,
        lumoPromiseBgColor: formData.get('lumoPromiseBgColor') as string || undefined,
        lumoPromiseTextColor: formData.get('lumoPromiseTextColor') as string || undefined,
        lumoPromiseTitleSize: formData.get('lumoPromiseTitleSize') as string || undefined,
        lumoPromiseTitleWeight: formData.get('lumoPromiseTitleWeight') as string || undefined,
        lumoPromiseFeature1Icon: formData.get('lumoPromiseFeature1Icon') as string || undefined,
        lumoPromiseFeature1Title: formData.get('lumoPromiseFeature1Title') as string || undefined,
        lumoPromiseFeature1Subtitle: formData.get('lumoPromiseFeature1Subtitle') as string || undefined,
        lumoPromiseFeature2Icon: formData.get('lumoPromiseFeature2Icon') as string || undefined,
        lumoPromiseFeature2Title: formData.get('lumoPromiseFeature2Title') as string || undefined,
        lumoPromiseFeature2Subtitle: formData.get('lumoPromiseFeature2Subtitle') as string || undefined,
        lumoPromiseFeature3Icon: formData.get('lumoPromiseFeature3Icon') as string || undefined,
        lumoPromiseFeature3Title: formData.get('lumoPromiseFeature3Title') as string || undefined,
        lumoPromiseFeature3Subtitle: formData.get('lumoPromiseFeature3Subtitle') as string || undefined,

        // Meet the Makers Section
        meetMakersEnabled: formData.get('meetMakersEnabled') === 'true',
        meetMakersTitle: formData.get('meetMakersTitle') as string || undefined,
        meetMakersDescription: formData.get('meetMakersDescription') as string || undefined,
        meetMakersBgColor: formData.get('meetMakersBgColor') as string || undefined,
        meetMakersTextColor: formData.get('meetMakersTextColor') as string || undefined,
        meetMakersTitleSize: formData.get('meetMakersTitleSize') as string || undefined,
        meetMakersTitleWeight: formData.get('meetMakersTitleWeight') as string || undefined,

        // Hero Announcement Overlay
        heroAnnouncementEnabled: formData.get('heroAnnouncementEnabled') === 'true',
        heroAnnouncementText: formData.get('heroAnnouncementText') as string || undefined,
        heroAnnouncementBgColor: formData.get('heroAnnouncementBgColor') as string || undefined,
        heroAnnouncementTextColor: formData.get('heroAnnouncementTextColor') as string || undefined,
        heroAnnouncementBorderColor: formData.get('heroAnnouncementBorderColor') as string || undefined,
        heroAnnouncementBorderRadius: parseInt(formData.get('heroAnnouncementBorderRadius') as string) || 12,
        heroAnnouncementFontSize: formData.get('heroAnnouncementFontSize') as string || undefined,
        heroAnnouncementFontWeight: formData.get('heroAnnouncementFontWeight') as string || undefined,
        heroAnnouncementPositionX: parseInt(formData.get('heroAnnouncementPositionX') as string) || 50,
        heroAnnouncementPositionY: parseInt(formData.get('heroAnnouncementPositionY') as string) || 10,
        heroAnnouncementWidth: parseInt(formData.get('heroAnnouncementWidth') as string) || 400,
        heroAnnouncementPadding: formData.get('heroAnnouncementPadding') as string || undefined,
        heroAnnouncementMobileWidth: parseInt(formData.get('heroAnnouncementMobileWidth') as string) || 90,
        heroAnnouncementMobileFontSize: formData.get('heroAnnouncementMobileFontSize') as string || undefined,
        heroAnnouncementLink: formData.get('heroAnnouncementLink') as string || undefined,
        heroAnnouncementShadow: formData.get('heroAnnouncementShadow') === 'true',
        heroAnnouncementAnimation: formData.get('heroAnnouncementAnimation') as string || undefined,
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
