
'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface Theme {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    backgroundImage: string;
    foregroundImage: string;
    foregroundImageScale?: number;
    foregroundImagePositionX?: number;
    foregroundImagePositionY?: number;
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
        const themeWithTimestamp = {
            ...theme,
            updatedAt: new Date().toISOString()
        };

        const { error } = await supabaseAdmin
            .from('site_settings')
            .upsert({
                key: 'theme',
                value: themeWithTimestamp,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Failed to save theme:', error);
        throw new Error('Failed to save theme. Ensure database is set up correctly.');
    }
}
