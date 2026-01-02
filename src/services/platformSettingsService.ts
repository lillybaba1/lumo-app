import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { 
  BoutiqueSystemSettings, 
  DEFAULT_BOUTIQUE_SETTINGS,
  PlatformSettings 
} from '@/lib/types';
import { logger } from '@/lib/logger';

const platformSettingsLogger = logger.child('PlatformSettingsService');

// ============================================
// Platform Settings Service
// Admin can configure platform-wide settings
// ============================================

const BOUTIQUE_SETTINGS_KEY = 'boutique_system';
const SETTINGS_TABLE = 'platform_settings';

/**
 * Get a platform setting by key
 */
export async function getPlatformSetting(key: string): Promise<any | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      platformSettingsLogger.error('Error fetching platform setting:', error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    platformSettingsLogger.error('Error in getPlatformSetting:', error);
    return null;
  }
}

/**
 * Set a platform setting
 */
export async function setPlatformSetting(
  key: string, 
  value: any, 
  category: PlatformSettings['category'] = 'general',
  description?: string,
  updatedBy?: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from(SETTINGS_TABLE)
      .upsert({
        key,
        value,
        category,
        description,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      }, {
        onConflict: 'key',
      });

    if (error) {
      platformSettingsLogger.error('Error setting platform setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    platformSettingsLogger.error('Error in setPlatformSetting:', error);
    return false;
  }
}

/**
 * Get all platform settings
 */
export async function getAllPlatformSettings(): Promise<PlatformSettings[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(SETTINGS_TABLE)
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      platformSettingsLogger.error('Error fetching all platform settings:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      key: row.key,
      value: row.value,
      category: row.category,
      description: row.description,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    }));
  } catch (error) {
    platformSettingsLogger.error('Error in getAllPlatformSettings:', error);
    return [];
  }
}

/**
 * Get settings by category
 */
export async function getSettingsByCategory(category: PlatformSettings['category']): Promise<PlatformSettings[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('category', category);

    if (error) {
      platformSettingsLogger.error('Error fetching settings by category:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      key: row.key,
      value: row.value,
      category: row.category,
      description: row.description,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    }));
  } catch (error) {
    platformSettingsLogger.error('Error in getSettingsByCategory:', error);
    return [];
  }
}

// ============================================
// Boutique System Settings
// ============================================

/**
 * Get boutique system settings
 * Returns defaults if not configured
 */
export async function getBoutiqueSettings(): Promise<BoutiqueSystemSettings> {
  try {
    const settings = await getPlatformSetting(BOUTIQUE_SETTINGS_KEY);
    
    if (!settings) {
      return DEFAULT_BOUTIQUE_SETTINGS;
    }

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_BOUTIQUE_SETTINGS,
      ...settings,
      tiers: {
        ...DEFAULT_BOUTIQUE_SETTINGS.tiers,
        ...(settings.tiers || {}),
      },
      features: {
        ...DEFAULT_BOUTIQUE_SETTINGS.features,
        ...(settings.features || {}),
      },
      payouts: {
        ...DEFAULT_BOUTIQUE_SETTINGS.payouts,
        ...(settings.payouts || {}),
      },
      content: {
        ...DEFAULT_BOUTIQUE_SETTINGS.content,
        ...(settings.content || {}),
      },
    };
  } catch (error) {
    platformSettingsLogger.error('Error getting boutique settings:', error);
    return DEFAULT_BOUTIQUE_SETTINGS;
  }
}

/**
 * Update boutique system settings
 */
export async function updateBoutiqueSettings(
  settings: Partial<BoutiqueSystemSettings>,
  updatedBy?: string
): Promise<boolean> {
  try {
    const currentSettings = await getBoutiqueSettings();
    
    const newSettings: BoutiqueSystemSettings = {
      ...currentSettings,
      ...settings,
      tiers: settings.tiers ? {
        ...currentSettings.tiers,
        ...settings.tiers,
      } : currentSettings.tiers,
      features: settings.features ? {
        ...currentSettings.features,
        ...settings.features,
      } : currentSettings.features,
      payouts: settings.payouts ? {
        ...currentSettings.payouts,
        ...settings.payouts,
      } : currentSettings.payouts,
      content: settings.content ? {
        ...currentSettings.content,
        ...settings.content,
      } : currentSettings.content,
    };

    return await setPlatformSetting(
      BOUTIQUE_SETTINGS_KEY,
      newSettings,
      'boutique',
      'Boutique system configuration',
      updatedBy
    );
  } catch (error) {
    platformSettingsLogger.error('Error updating boutique settings:', error);
    return false;
  }
}

/**
 * Update a single tier's settings
 */
export async function updateTierSettings(
  tier: 'free' | 'pro' | 'enterprise',
  settings: Partial<BoutiqueSystemSettings['tiers']['free']>,
  updatedBy?: string
): Promise<boolean> {
  try {
    const currentSettings = await getBoutiqueSettings();
    
    const newSettings: BoutiqueSystemSettings = {
      ...currentSettings,
      tiers: {
        ...currentSettings.tiers,
        [tier]: {
          ...currentSettings.tiers[tier],
          ...settings,
        },
      },
    };

    return await setPlatformSetting(
      BOUTIQUE_SETTINGS_KEY,
      newSettings,
      'boutique',
      'Boutique system configuration',
      updatedBy
    );
  } catch (error) {
    platformSettingsLogger.error('Error updating tier settings:', error);
    return false;
  }
}

/**
 * Reset boutique settings to defaults
 */
export async function resetBoutiqueSettings(updatedBy?: string): Promise<boolean> {
  return await setPlatformSetting(
    BOUTIQUE_SETTINGS_KEY,
    DEFAULT_BOUTIQUE_SETTINGS,
    'boutique',
    'Boutique system configuration',
    updatedBy
  );
}

/**
 * Get commission rate for a specific tier
 * Uses platform settings, falls back to defaults
 */
export async function getCommissionRate(tier: 'free' | 'pro' | 'enterprise'): Promise<number> {
  const settings = await getBoutiqueSettings();
  return settings.tiers[tier]?.commissionRate ?? DEFAULT_BOUTIQUE_SETTINGS.tiers[tier].commissionRate;
}

/**
 * Check if boutique system is enabled
 */
export async function isBoutiqueSystemEnabled(): Promise<boolean> {
  const settings = await getBoutiqueSettings();
  return settings.enabled;
}

/**
 * Check if new sellers are allowed
 */
export async function areNewSellersAllowed(): Promise<boolean> {
  const settings = await getBoutiqueSettings();
  return settings.enabled && settings.allowNewSellers;
}

