'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Pages } from '@/lib/types';
import * as defaultPagesData from '@/data/pages.json';

export async function getPages(): Promise<Pages | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('content')
            .select('*')
            .eq('key', 'pages')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No pages found, return default
                return defaultPagesData;
            }
            throw error;
        }

        return data?.value as Pages || defaultPagesData;
    } catch (error) {
        console.error('Failed to get pages:', error);
        return defaultPagesData;
    }
}

export async function savePages(pages: Pages): Promise<void> {
    try {
        const { error } = await supabaseAdmin
            .from('content')
            .upsert({
                key: 'pages',
                value: pages,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Failed to save pages:', error);
        throw new Error('Failed to save pages. Ensure database is set up correctly.');
    }
}
