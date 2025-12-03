'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-admin';
import { 
  getBoutiqueSettings, 
  updateBoutiqueSettings,
  updateTierSettings,
  resetBoutiqueSettings,
  setPlatformSetting
} from '@/services/platformSettingsService';
import { BoutiqueSystemSettings, SubscriptionTierSettings } from '@/lib/types';

export async function getBoutiqueSettingsAction() {
  await requireAdmin();
  return await getBoutiqueSettings();
}

export async function updateBoutiqueSettingsAction(
  settings: Partial<BoutiqueSystemSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await requireAdmin();
    
    const success = await updateBoutiqueSettings(settings, userId);
    
    if (success) {
      revalidatePath('/admin/boutique-settings');
      revalidatePath('/boutiques');
      revalidatePath('/business');
      return { success: true };
    }
    
    return { success: false, error: 'Failed to update settings' };
  } catch (error: any) {
    console.error('Error updating boutique settings:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

export async function updateTierSettingsAction(
  tier: 'free' | 'pro' | 'enterprise',
  settings: Partial<SubscriptionTierSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await requireAdmin();
    
    const success = await updateTierSettings(tier, settings, userId);
    
    if (success) {
      revalidatePath('/admin/boutique-settings');
      revalidatePath('/business/subscription');
      return { success: true };
    }
    
    return { success: false, error: 'Failed to update tier settings' };
  } catch (error: any) {
    console.error('Error updating tier settings:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

export async function resetBoutiqueSettingsAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await requireAdmin();
    
    const success = await resetBoutiqueSettings(userId);
    
    if (success) {
      revalidatePath('/admin/boutique-settings');
      return { success: true };
    }
    
    return { success: false, error: 'Failed to reset settings' };
  } catch (error: any) {
    console.error('Error resetting boutique settings:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

// Bulk update multiple sellers
export async function bulkUpdateSellersAction(
  sellerIds: string[],
  updates: {
    subscriptionTier?: 'free' | 'pro' | 'enterprise';
    verificationStatus?: 'verified' | 'unverified' | 'pending' | 'rejected';
    status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';
    commissionRate?: number;
  }
): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  try {
    await requireAdmin();
    
    // Import dynamically to avoid circular deps
    const { updateBusinessAccount } = await import('@/services/businessAccountService');
    
    let updatedCount = 0;
    for (const sellerId of sellerIds) {
      const success = await updateBusinessAccount(sellerId, {
        subscriptionTier: updates.subscriptionTier,
        verificationStatus: updates.verificationStatus,
        status: updates.status,
      });
      if (success) updatedCount++;
    }
    
    revalidatePath('/admin/sellers');
    revalidatePath('/admin/boutique-settings');
    
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('Error bulk updating sellers:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

// Feature/unfeature a boutique
export async function toggleBoutiqueFeaturedAction(
  boutiqueId: string,
  featured: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    
    const { updateBoutique } = await import('@/services/boutiqueService');
    
    const success = await updateBoutique(boutiqueId, { isFeatured: featured });
    
    if (success) {
      revalidatePath('/boutiques');
      revalidatePath('/admin/boutique-settings');
      return { success: true };
    }
    
    return { success: false, error: 'Failed to update boutique' };
  } catch (error: any) {
    console.error('Error toggling boutique featured:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

// Suspend/activate a seller
export async function toggleSellerStatusAction(
  sellerId: string,
  status: 'ACTIVE' | 'SUSPENDED'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    
    const { updateBusinessAccount } = await import('@/services/businessAccountService');
    
    const success = await updateBusinessAccount(sellerId, { status });
    
    if (success) {
      revalidatePath('/admin/sellers');
      revalidatePath('/boutiques');
      return { success: true };
    }
    
    return { success: false, error: 'Failed to update seller status' };
  } catch (error: any) {
    console.error('Error toggling seller status:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

// Force upgrade a seller to enterprise (admin override)
export async function forceUpgradeSellerAction(
  sellerId: string,
  tier: 'free' | 'pro' | 'enterprise'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    
    const { updateBusinessAccount } = await import('@/services/businessAccountService');
    
    const success = await updateBusinessAccount(sellerId, { 
      subscriptionTier: tier,
      verificationStatus: tier === 'enterprise' ? 'verified' : undefined,
    });
    
    if (success) {
      revalidatePath('/admin/sellers');
      revalidatePath('/business/subscription');
      return { success: true };
    }
    
    return { success: false, error: 'Failed to upgrade seller' };
  } catch (error: any) {
    console.error('Error upgrading seller:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}
