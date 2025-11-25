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
    heroBackgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
    heroImageObjectPosition: 'center',
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
        const { error } = await supabaseAdmin
            .from('site_settings')
            .upsert({
                key: 'storeConfig',
                value: settings,
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
