'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    // Header Settings
    headerBgColor?: string;
    headerTextColor?: string;
    headerButtonStyle?: 'outline' | 'solid' | 'ghost';
    headerButtonColor?: string;
    homeButtonGradientFrom?: string;
    homeButtonGradientTo?: string;

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
    theme: 'minimal-light',
    heroHeading: 'Step into Lumo',
    heroTagline: 'Discover exceptional products crafted with care. Your journey to quality starts here.',
    heroBackgroundImage: '',
    heroImageObjectPosition: 'center',
    chatbotImage: '',
    chatbotName: 'Luna',
    chatbotEnabled: true,
    chatbotGlowColor: '#8b5cf6',
    chatbotBubbleGradientFrom: '#8b5cf6',
    chatbotBubbleGradientTo: '#ec4899',
    chatbotLabelBgColor: '#ffffff',
    chatbotLabelTextColor: '#8b5cf6',
    chatbotPulseEnabled: true,
    headerBgColor: '#ffffff',
    headerTextColor: '#000000',
    headerButtonStyle: 'outline',
    headerButtonColor: '#8b5cf6',
    homeButtonGradientFrom: '#8b5cf6',
    homeButtonGradientTo: '#ec4899',
    announcementEnabled: false,
    announcementText: '',
    announcementBgColor: '#8b5cf6',
    announcementTextColor: '#ffffff',
    announcementLink: '',
    // Footer defaults
    footerDescription: "We're building a trusted shopping experience for Africa. Quality products, secure payments, and reliable delivery across the continent.",
    footerCopyright: 'Lumo – Africa\'s Trusted Marketplace',
    footerTagline: 'Building trust, one order at a time 🌍',
    footerEmail: 'support@lumo-app.org',
    footerPhone: '+220 700 1234',
    footerWhatsApp: '+2207001234',
    socialFacebook: 'https://facebook.com/lumogambia',
    socialInstagram: 'https://instagram.com/lumo_gambia',
    socialX: 'https://x.com/lumogambia',
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
        console.error('Failed to get settings:', error);
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
        console.error('Failed to save settings:', error);
        throw new Error('Failed to save settings. Ensure database is set up correctly.');
    }
}

// Alias for getSettings to match different naming conventions
export async function getSiteSettings(): Promise<Settings> {
    return getSettings();
}
