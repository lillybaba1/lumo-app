'use server';

import { logger } from '@/lib/logger';

const settingsLogger = logger.child('SettingsService');

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cache } from 'react';

export interface Settings {
    // General Store Info
    currency: string;
    storeName?: string;
    storeTagline?: string;
    storeEmail?: string;
    storePhone?: string;
    storeAddress?: string;
    storeLogo?: string;

    // Logo & Branding
    logoUrl?: string;
    logoAlt?: string;
    logoCropX?: number;
    logoCropY?: number;
    logoCropWidth?: number;
    logoCropHeight?: number;
    logoWidth?: number;
    logoHeight?: number;
    faviconUrl?: string;

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

    // Appearance Settings
    theme?: string; // Theme ID (e.g., 'minimal-light', 'dark-luxe')

    // Hero Section Settings
    heroHeading?: string;
    heroTagline?: string;
    heroBackgroundImage?: string;
    heroCropX?: number;
    heroCropY?: number;
    heroCropWidth?: number;
    heroCropHeight?: number;
    heroImageObjectPosition?: string; // e.g., 'center', 'top', '50% 30%'
    heroImageFit?: 'cover' | 'contain'; // How the image should fit
    
    // Hero text styling
    heroHeadingColor?: string;
    heroTaglineColor?: string;
    heroHeadingPosition?: { x: number; y: number };
    heroTaglinePosition?: { x: number; y: number };
    heroCtaPosition?: { x: number; y: number }; // Shop New Arrivals + Browse Collections buttons

    // Hero Button Colors
    heroButton1BgColor?: string; // Shop New Arrivals background
    heroButton1TextColor?: string; // Shop New Arrivals text
    heroButton2BgColor?: string; // Browse Collections background
    heroButton2TextColor?: string; // Browse Collections text
    heroButton2BorderColor?: string; // Browse Collections border
    heroButton3BgColor?: string; // Featured button background
    heroButton3TextColor?: string; // Featured button text

    // Chatbot Settings
    chatbotImage?: string;
    chatbotName?: string;
    chatbotEnabled?: boolean;
    chatbotGlowColor?: string;
    chatbotBubbleGradientFrom?: string;
    chatbotBubbleGradientTo?: string;
    chatbotLabelBgColor?: string;
    chatbotLabelTextColor?: string;
    chatbotPulseEnabled?: boolean;

    // Announcement Bar Settings
    announcementEnabled?: boolean;
    announcementText?: string;
    announcementBgColor?: string;
    announcementTextColor?: string;
    announcementLink?: string;

    // Footer Settings
    footerDescription?: string;
    footerCopyright?: string;
    footerTagline?: string;
    
    // Footer Contact
    footerEmail?: string;
    footerPhone?: string;
    footerWhatsApp?: string;
    
    // Footer Social Media
    socialFacebook?: string;
    socialInstagram?: string;
    socialX?: string;
    socialTiktok?: string;
    socialYoutube?: string;
    
    // Footer Trust Badges
    trustBadge1Title?: string;
    trustBadge1Subtitle?: string;
    trustBadge2Title?: string;
    trustBadge2Subtitle?: string;
    trustBadge3Title?: string;
    trustBadge3Subtitle?: string;
    trustBadge4Title?: string;
    trustBadge4Subtitle?: string;
    trustBadge5Title?: string;
    trustBadge5Subtitle?: string;
    
    // Footer Payment Methods (comma-separated)
    footerPaymentMethods?: string;
    
    // Footer Delivery Countries (comma-separated, format: "emoji Country")
    footerDeliveryCountries?: string;

    // Category Section Settings
    categorySectionBgType?: 'color' | 'image' | 'gradient';
    categorySectionBgColor?: string;
    categorySectionBgImage?: string;
    categorySectionBgGradientFrom?: string;
    categorySectionBgGradientTo?: string;
    categorySectionBgGradientDirection?: string;
    categorySectionTextColor?: string;
    categorySectionPadding?: string;

    // JulaZone Promise Section
    lumoPromiseEnabled?: boolean;
    lumoPromiseTitle?: string;
    lumoPromiseDescription?: string;
    lumoPromiseBgColor?: string;
    lumoPromiseTextColor?: string;
    lumoPromiseTitleSize?: string;
    lumoPromiseTitleWeight?: string;
    lumoPromiseFeature1Icon?: string;
    lumoPromiseFeature1Title?: string;
    lumoPromiseFeature1Subtitle?: string;
    lumoPromiseFeature2Icon?: string;
    lumoPromiseFeature2Title?: string;
    lumoPromiseFeature2Subtitle?: string;
    lumoPromiseFeature3Icon?: string;
    lumoPromiseFeature3Title?: string;
    lumoPromiseFeature3Subtitle?: string;

    // Meet the Makers Section
    meetMakersEnabled?: boolean;
    meetMakersTitle?: string;
    meetMakersDescription?: string;
    meetMakersBgColor?: string;
    meetMakersTextColor?: string;
    meetMakersTitleSize?: string;
    meetMakersTitleWeight?: string;

    // Hero Announcement Overlay
    heroAnnouncementEnabled?: boolean;
    heroAnnouncementText?: string;
    heroAnnouncementBgColor?: string;
    heroAnnouncementTextColor?: string;
    heroAnnouncementBorderColor?: string;
    heroAnnouncementBorderRadius?: number;
    heroAnnouncementFontSize?: string; // 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
    heroAnnouncementFontWeight?: string; // 'normal' | 'medium' | 'semibold' | 'bold'
    heroAnnouncementPositionX?: number; // 0-100 percentage
    heroAnnouncementPositionY?: number; // 0-100 percentage
    heroAnnouncementWidth?: number; // Desktop width in pixels
    heroAnnouncementPadding?: string; // 'sm' | 'md' | 'lg'
    heroAnnouncementMobileWidth?: number; // Mobile width percentage (0-100)
    heroAnnouncementMobileFontSize?: string; // Mobile font size
    heroAnnouncementLink?: string; // Optional link URL
    heroAnnouncementShadow?: boolean; // Enable box shadow
    heroAnnouncementAnimation?: string; // 'none' | 'pulse' | 'bounce' | 'shake'
}

const defaultSettings: Settings = {
    currency: 'USD',
    storeName: 'JulaZone Store',
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
    theme: 'minimal-light',
    heroHeading: 'Step into JulaZone',
    heroTagline: 'Discover exceptional products crafted with care. Your journey to quality starts here.',
    heroBackgroundImage: '',
    heroImageObjectPosition: 'center',
    heroHeadingColor: '#ffffff',
    heroTaglineColor: '#ffffff',
    heroHeadingPosition: { x: 5, y: 35 },
    heroTaglinePosition: { x: 5, y: 50 },
    heroCtaPosition: { x: 5, y: 65 },
    chatbotImage: '',
    chatbotName: 'Luna',
    chatbotEnabled: true,
    chatbotGlowColor: '#4F46E5',
    chatbotBubbleGradientFrom: '#4F46E5',
    chatbotBubbleGradientTo: '#14B8A6',
    chatbotLabelBgColor: '#ffffff',
    chatbotLabelTextColor: '#4F46E5',
    chatbotPulseEnabled: true,
    announcementEnabled: false,
    announcementText: '',
    announcementBgColor: '#4F46E5',
    announcementTextColor: '#ffffff',
    announcementLink: '',
    // Footer defaults
    footerDescription: "We're building a trusted shopping experience for Africa. Quality products, secure payments, and reliable delivery across the continent.",
    footerCopyright: 'JulaZone – Africa\'s Trusted Marketplace',
    footerTagline: 'Building trust, one order at a time 🌍',
    footerEmail: 'support@julazone.com',
    footerPhone: '+220 700 1234',
    footerWhatsApp: '+2207001234',
    socialFacebook: 'https://facebook.com/julazone_gm',
    socialInstagram: 'https://instagram.com/julazone_gm',
    socialX: 'https://x.com/julazone_gm',
    socialTiktok: '',
    socialYoutube: '',
    trustBadge1Title: 'Secure Payments',
    trustBadge1Subtitle: '100% Protected',
    trustBadge2Title: 'Fast Delivery',
    trustBadge2Subtitle: '2-7 Business Days',
    trustBadge3Title: 'Easy Refunds',
    trustBadge3Subtitle: '7-Day Returns',
    trustBadge4Title: 'Local Support',
    trustBadge4Subtitle: 'We Speak Your Language',
    trustBadge5Title: "Africa's Marketplace",
    trustBadge5Subtitle: 'Built for Africa',
    footerPaymentMethods: 'Wave,Afrimoney,QMoney,Bank Transfer,Cash on Delivery',
    footerDeliveryCountries: '🇬🇲 Gambia,🇸🇳 Senegal,🇳🇬 Nigeria,🇬🇭 Ghana,🇰🇪 Kenya',
    // Hero Announcement Overlay defaults
    heroAnnouncementEnabled: false,
    heroAnnouncementText: '🔥 Free Shipping on Orders Over $50! 🔥',
    heroAnnouncementBgColor: '#4F46E5',
    heroAnnouncementTextColor: '#ffffff',
    heroAnnouncementBorderColor: '#ffffff',
    heroAnnouncementBorderRadius: 12,
    heroAnnouncementFontSize: 'base',
    heroAnnouncementFontWeight: 'semibold',
    heroAnnouncementPositionX: 50,
    heroAnnouncementPositionY: 10,
    heroAnnouncementWidth: 400,
    heroAnnouncementPadding: 'md',
    heroAnnouncementMobileWidth: 90,
    heroAnnouncementMobileFontSize: 'sm',
    heroAnnouncementLink: '',
    heroAnnouncementShadow: true,
    heroAnnouncementAnimation: 'none',
};

export async function getSettings(): Promise<Settings> {
    try {
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('*')
            .eq('key', 'storeConfig')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No settings found, return default
                return defaultSettings;
            }
            throw error;
        }

        return { ...defaultSettings, ...(data?.value as Settings) } as Settings;
    } catch (error) {
        settingsLogger.error('Failed to get settings:', error);
        return defaultSettings;
    }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
    try {
        // Fetch the current row directly to avoid merging in fallback defaults
        const { data: existingRow, error: fetchError } = await supabaseAdmin
            .from('site_settings')
            .select('value')
            .eq('key', 'storeConfig')
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // Only ignore "no rows" errors; surface anything else
            throw fetchError;
        }

        const currentValue = (existingRow?.value as Partial<Settings> | undefined) ?? {};
        const settingsToSave = { ...currentValue, ...settings };

        const { error } = await supabaseAdmin
            .from('site_settings')
            .upsert({
                key: 'storeConfig',
                value: settingsToSave,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            });

        if (error) {
            throw error;
        }
    } catch (error) {
        settingsLogger.error('Failed to save settings:', error);
        throw new Error('Failed to save settings. Ensure database is set up correctly.');
    }
}

// Cached version of getSettings to deduplicate requests within a single render
// React's cache() deduplicates calls within the same request lifecycle
export const getSiteSettings = cache(async (): Promise<Settings> => {
    return getSettings();
});

