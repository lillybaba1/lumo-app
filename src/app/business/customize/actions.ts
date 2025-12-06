'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Get user's boutique ID
async function getBoutiqueId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { data: businessAccount } = await supabase
    .from('business_accounts')
    .select('id')
    .eq('owner_user_id', user.id)
    .single();

  if (!businessAccount) throw new Error('No business account found');

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id')
    .eq('business_account_id', businessAccount.id)
    .single();

  if (!boutique) throw new Error('No boutique found');

  return boutique.id;
}

// Theme
export async function getTheme() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_themes')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || getDefaultTheme() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function getDefaultTheme() {
  return {
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    accent_color: '#f59e0b',
    background_color: '#ffffff',
    text_color: '#1f2937',
    heading_font: 'Inter',
    body_font: 'Inter',
    layout_style: 'grid',
    products_per_row: 4,
    show_sidebar: true,
    header_style: 'default',
    footer_style: 'default',
  };
}

export async function updateTheme(data: any) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_themes')
      .upsert({
        boutique_id: boutiqueId,
        ...data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    revalidatePath('/business/customize');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Banners
export async function getBanners() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_banners')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('position');

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createBanner(data: { image_url: string; position?: number }) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data: banner, error } = await supabase
      .from('boutique_banners')
      .insert({
        boutique_id: boutiqueId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/customize');
    return { success: true, data: banner };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateBanner(id: string, data: any) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_banners')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/customize');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteBanner(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_banners')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/customize');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// About
export async function getAbout() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_about')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || {
      story_title: 'Our Story',
      story_content: '',
      mission_statement: '',
      values: [],
      faqs: [],
    }};
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAbout(data: any) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_about')
      .upsert({
        boutique_id: boutiqueId,
        ...data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    revalidatePath('/business/customize');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Social Links
export async function getSocialLinks() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_social_links')
      .select('*')
      .eq('boutique_id', boutiqueId);

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSocialLinks(links: { platform: string; url: string; is_active: boolean }[]) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    // Delete existing links
    await supabase
      .from('boutique_social_links')
      .delete()
      .eq('boutique_id', boutiqueId);

    // Insert new links (only those with URLs)
    const validLinks = links.filter(l => l.url?.trim());
    if (validLinks.length > 0) {
      const { error } = await supabase
        .from('boutique_social_links')
        .insert(validLinks.map(l => ({ boutique_id: boutiqueId, ...l })));

      if (error) throw error;
    }

    revalidatePath('/business/customize');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Announcements
export async function getAnnouncement() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_announcements')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAnnouncement(data: any) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    // Deactivate existing announcements
    await supabase
      .from('boutique_announcements')
      .update({ is_active: false })
      .eq('boutique_id', boutiqueId);

    // Insert new announcement
    const { error } = await supabase
      .from('boutique_announcements')
      .insert({
        boutique_id: boutiqueId,
        ...data,
      });

    if (error) throw error;

    revalidatePath('/business/customize');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sections
export async function getSections() {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boutique_sections')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('position');

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSection(data: { title: string; section_type: string; content?: any }) {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    // Get max position
    const { data: existing } = await supabase
      .from('boutique_sections')
      .select('position')
      .eq('boutique_id', boutiqueId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const position = (existing?.position || 0) + 1;

    const { data: section, error } = await supabase
      .from('boutique_sections')
      .insert({
        boutique_id: boutiqueId,
        position,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/customize');
    return { success: true, data: section };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSection(id: string, data: any) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_sections')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/customize');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSection(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('boutique_sections')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/business/customize');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
