import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { updateTierSettings, getBoutiqueSettings } from '@/services/platformSettingsService';
import { SubscriptionTierSettings } from '@/lib/types';

// GET - Fetch tier settings
export async function GET(request: NextRequest) {
  try {
    await requireAdmin({ redirect: false });
    
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') as 'free' | 'pro' | 'enterprise' | null;
    
    const settings = await getBoutiqueSettings();
    
    if (tier && settings.tiers[tier]) {
      return NextResponse.json({ success: true, data: settings.tiers[tier] });
    }
    
    return NextResponse.json({ success: true, data: settings.tiers });
  } catch (error: any) {
    console.error('Error fetching tier settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tier settings' },
      { status: error.statusCode || 500 }
    );
  }
}

// PUT - Update tier settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await requireAdmin({ redirect: false });
    
    const body = await request.json();
    const { tier, settings } = body as { 
      tier: 'free' | 'pro' | 'enterprise'; 
      settings: Partial<SubscriptionTierSettings> 
    };
    
    if (!tier || !settings) {
      return NextResponse.json(
        { success: false, error: 'Tier and settings are required' },
        { status: 400 }
      );
    }
    
    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier. Must be free, pro, or enterprise' },
        { status: 400 }
      );
    }
    
    const success = await updateTierSettings(tier, settings, userId);
    
    if (success) {
      return NextResponse.json({ success: true, message: `${tier} tier settings updated` });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update tier settings' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error updating tier settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update tier settings' },
      { status: error.statusCode || 500 }
    );
  }
}
