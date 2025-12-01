'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export interface LogoSettings {
  logoUrl?: string;
  logoAlt?: string;
  logoCropX?: number;
  logoCropY?: number;
  logoCropWidth?: number;
  logoCropHeight?: number;
  logoWidth?: number;
  logoHeight?: number;
  faviconUrl?: string;
}

export async function getLogoSettings(): Promise<LogoSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'storeConfig')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching logo settings:', error);
      throw error;
    }

    const value = data?.value as any || {};
    
    return {
      logoUrl: value.logoUrl || '',
      logoAlt: value.logoAlt || 'Store Logo',
      logoCropX: value.logoCropX || 0,
      logoCropY: value.logoCropY || 0,
      logoCropWidth: value.logoCropWidth || 0,
      logoCropHeight: value.logoCropHeight || 0,
      logoWidth: value.logoWidth || 200,
      logoHeight: value.logoHeight || 60,
      faviconUrl: value.faviconUrl || '',
    };
  } catch (error) {
    console.error('Failed to get logo settings:', error);
    return {
      logoUrl: '',
      logoAlt: 'Store Logo',
      logoWidth: 200,
      logoHeight: 60,
      faviconUrl: '',
    };
  }
}

export async function saveLogoSettings(
  settings: LogoSettings
): Promise<{ success: boolean; message: string }> {
  try {
    // Fetch current settings
    const { data: existingRow, error: fetchError } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'storeConfig')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const currentValue = (existingRow?.value as any) || {};
    
    // Merge logo settings with existing settings
    const settingsToSave = {
      ...currentValue,
      logoUrl: settings.logoUrl,
      logoAlt: settings.logoAlt,
      logoCropX: settings.logoCropX,
      logoCropY: settings.logoCropY,
      logoCropWidth: settings.logoCropWidth,
      logoCropHeight: settings.logoCropHeight,
      logoWidth: settings.logoWidth,
      logoHeight: settings.logoHeight,
      faviconUrl: settings.faviconUrl,
    };

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'storeConfig',
        value: settingsToSave,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      });

    if (error) {
      console.error('Error saving logo settings:', error);
      throw error;
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin/logo');
    
    return { success: true, message: 'Logo settings saved successfully!' };
  } catch (error) {
    console.error('Failed to save logo settings:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to save logo settings' 
    };
  }
}

export async function uploadLogo(
  formData: FormData
): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'logo'; // 'logo' or 'favicon'
    
    if (!file) {
      return { success: false, message: 'No file provided' };
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, message: 'Invalid file type. Please upload PNG, JPG, WebP, SVG, or ICO.' };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: 'File size must be less than 5MB' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${type}_${timestamp}.${ext}`;
    const filePath = `branding/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl, message: 'Logo uploaded successfully!' };
  } catch (error) {
    console.error('Failed to upload logo:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to upload logo' 
    };
  }
}

export async function deleteLogo(type: 'logo' | 'favicon'): Promise<{ success: boolean; message: string }> {
  try {
    // Get current settings
    const settings = await getLogoSettings();
    const urlToDelete = type === 'logo' ? settings.logoUrl : settings.faviconUrl;
    
    if (urlToDelete) {
      // Extract file path from URL
      const urlParts = urlToDelete.split('/product-images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Delete from storage
        const { error: deleteError } = await supabaseAdmin.storage
          .from('product-images')
          .remove([filePath]);
          
        if (deleteError) {
          console.warn('Could not delete old file:', deleteError);
        }
      }
    }

    // Fetch current settings
    const { data: existingRow, error: fetchError } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'storeConfig')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const currentValue = (existingRow?.value as any) || {};
    
    // Remove the logo/favicon from settings
    if (type === 'logo') {
      delete currentValue.logoUrl;
      delete currentValue.logoCropX;
      delete currentValue.logoCropY;
      delete currentValue.logoCropWidth;
      delete currentValue.logoCropHeight;
    } else {
      delete currentValue.faviconUrl;
    }

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'storeConfig',
        value: currentValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) throw error;

    revalidatePath('/', 'layout');
    
    return { success: true, message: `${type === 'logo' ? 'Logo' : 'Favicon'} deleted successfully!` };
  } catch (error) {
    console.error('Failed to delete logo:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete' 
    };
  }
}
