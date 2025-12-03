'use server';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { 
  getBoutiqueSettings, 
  updateBoutiqueSettings,
  resetBoutiqueSettings,
  getAllPlatformSettings,
  setPlatformSetting
} from '@/services/platformSettingsService';

// GET - Fetch all platform settings or specific boutique settings
export async function GET(request: NextRequest) {
  try {
    await requireAdmin({ redirect: false });
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'boutique') {
      const settings = await getBoutiqueSettings();
      return NextResponse.json({ success: true, data: settings });
    }
    
    // Return all platform settings
    const settings = await getAllPlatformSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Error fetching platform settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: error.statusCode || 500 }
    );
  }
}

// PUT - Update platform settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await requireAdmin({ redirect: false });
    
    const body = await request.json();
    const { type, settings, key, value, category, description } = body;
    
    if (type === 'boutique') {
      // Update boutique settings
      const success = await updateBoutiqueSettings(settings, userId);
      
      if (success) {
        return NextResponse.json({ success: true, message: 'Boutique settings updated' });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update boutique settings' },
        { status: 500 }
      );
    }
    
    if (key && value !== undefined) {
      // Update a specific setting
      const success = await setPlatformSetting(key, value, category, description, userId);
      
      if (success) {
        return NextResponse.json({ success: true, message: 'Setting updated' });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update setting' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating platform settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: error.statusCode || 500 }
    );
  }
}

// DELETE - Reset boutique settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAdmin({ redirect: false });
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'boutique') {
      const success = await resetBoutiqueSettings(userId);
      
      if (success) {
        return NextResponse.json({ success: true, message: 'Boutique settings reset to defaults' });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to reset settings' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Specify type to reset' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error resetting platform settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset settings' },
      { status: error.statusCode || 500 }
    );
  }
}
