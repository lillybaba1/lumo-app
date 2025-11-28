'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { FAQData } from '@/lib/types';

export async function getFAQData(): Promise<FAQData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'faq_data')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return default
        return {
          title: 'Frequently Asked Questions',
          introText: 'Find answers to common questions below.',
          faqs: []
        };
      }
      throw error;
    }

    return data?.value as FAQData || {
      title: 'Frequently Asked Questions',
      introText: '',
      faqs: []
    };
  } catch (error) {
    console.error('Failed to get FAQ data:', error);
    return {
      title: 'Frequently Asked Questions',
      introText: '',
      faqs: []
    };
  }
}

export async function saveFAQData(faqData: FAQData) {
  try {
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'faq_data',
        value: {
          ...faqData,
          updatedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save FAQ data:', error);
    throw new Error('Failed to save FAQ data.');
  }
}
