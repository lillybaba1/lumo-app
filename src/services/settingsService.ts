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
