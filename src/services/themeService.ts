
'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface CropData {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Theme {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    backgroundImage: string;
    foregroundImage: string;
    foregroundImageScale?: number;
    foregroundImagePositionX?: number;
    foregroundImagePositionY?: number;
    backgroundImageCrop?: CropData;
    foregroundImageCrop?: CropData;
    updatedAt?: string;
}

export async function getTheme(): Promise<Theme | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('*')
            .eq('key', 'theme')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No theme found
                return null;
            }
            throw error;
        }

        return data?.value as Theme || null;
    } catch (error) {
        console.error('Failed to get theme:', error);
        return null;
    }
}

export async function saveTheme(theme: Partial<Theme>): Promise<void> {
    try {
        console.log('saveTheme called with:', theme);

        const themeWithTimestamp = {
            ...theme,
            updatedAt: new Date().toISOString()
        };

        console.log('Attempting to upsert theme to site_settings...');

        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .upsert({
                key: 'theme',
                value: themeWithTimestamp,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            })
            .select();

        if (error) {
            console.error('Supabase error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('Theme saved successfully:', data);
    } catch (error) {
        console.error('Failed to save theme - full error:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to save theme: ${error.message}`);
        }
        throw new Error('Failed to save theme. Ensure database is set up correctly.');
    }
}
