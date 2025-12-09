'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ContactData } from '@/lib/types';

export async function getContactData(): Promise<ContactData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'contact_data')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return default
        return {
          title: 'Contact Us',
          introText: 'We\'d love to hear from you! Get in touch with us using the information below.',
          email: 'support@julazone.com',
          phone: '(123) 456-7890',
          address: '',
          socialLinks: {}
        };
      }
      throw error;
    }

    return data?.value as ContactData || {
      title: 'Contact Us',
      introText: '',
      email: '',
      phone: '',
      address: '',
      socialLinks: {}
    };
  } catch (error) {
    console.error('Failed to get contact data:', error);
    return {
      title: 'Contact Us',
      introText: '',
      email: '',
      phone: '',
      address: '',
      socialLinks: {}
    };
  }
}

export async function saveContactData(contactData: ContactData) {
  try {
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'contact_data',
        value: {
          ...contactData,
          updatedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save contact data:', error);
    throw new Error('Failed to save contact data.');
  }
}
