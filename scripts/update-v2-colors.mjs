#!/usr/bin/env node
/**
 * Update platform settings to Modern Premium v2.0 color palette
 * 
 * This script updates stored settings in the database from the old neon purple/pink
 * palette to the new sophisticated indigo/teal palette.
 * 
 * Run: node scripts/update-v2-colors.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Color mapping: old neon → new premium
const colorMapping = {
  '#8b5cf6': '#4F46E5',  // neon purple → indigo
  '#ec4899': '#14B8A6',  // neon pink → teal
  '#8B5CF6': '#4F46E5',  // uppercase variant
  '#EC4899': '#14B8A6',  // uppercase variant
};

// Settings keys that contain color values
const colorSettings = [
  'headerButtonColor',
  'homeButtonGradientFrom', 
  'homeButtonGradientTo',
  'chatbotGlowColor',
  'chatbotBubbleGradientFrom',
  'chatbotBubbleGradientTo',
  'chatbotLabelTextColor',
  'announcementBgColor',
  'heroAnnouncementBgColor',
];

async function updatePlatformSettings() {
  console.log('📦 Fetching platform settings...');
  
  const { data: settings, error } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('key', 'site_settings')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('ℹ️  No site_settings found - using code defaults');
      return;
    }
    console.error('❌ Error fetching settings:', error);
    return;
  }

  if (!settings?.value) {
    console.log('ℹ️  No value in site_settings');
    return;
  }

  const currentSettings = settings.value;
  let updatedSettings = { ...currentSettings };
  let changesCount = 0;

  console.log('\n🎨 Checking color settings...');
  
  for (const key of colorSettings) {
    const currentValue = currentSettings[key];
    if (currentValue && colorMapping[currentValue]) {
      console.log(`  ✓ ${key}: ${currentValue} → ${colorMapping[currentValue]}`);
      updatedSettings[key] = colorMapping[currentValue];
      changesCount++;
    }
  }

  if (changesCount === 0) {
    console.log('\n✅ All settings already using v2.0 colors!');
    return;
  }

  console.log(`\n📝 Updating ${changesCount} color settings...`);

  const { error: updateError } = await supabase
    .from('platform_settings')
    .update({ 
      value: updatedSettings,
      updated_at: new Date().toISOString()
    })
    .eq('key', 'site_settings');

  if (updateError) {
    console.error('❌ Error updating settings:', updateError);
    return;
  }

  console.log('✅ Platform settings updated to v2.0 palette!');
}

async function updateBoutiqueColors() {
  console.log('\n🏪 Checking boutique colors...');
  
  const { data: boutiques, error } = await supabase
    .from('boutiques')
    .select('id, display_name, theme_color, accent_color');

  if (error) {
    console.error('❌ Error fetching boutiques:', error);
    return;
  }

  if (!boutiques || boutiques.length === 0) {
    console.log('ℹ️  No boutiques found');
    return;
  }

  let updatedCount = 0;

  for (const boutique of boutiques) {
    const updates = {};
    
    if (boutique.theme_color && colorMapping[boutique.theme_color]) {
      updates.theme_color = colorMapping[boutique.theme_color];
    }
    if (boutique.accent_color && colorMapping[boutique.accent_color]) {
      updates.accent_color = colorMapping[boutique.accent_color];
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('boutiques')
        .update(updates)
        .eq('id', boutique.id);

      if (updateError) {
        console.error(`  ❌ Failed to update ${boutique.display_name}:`, updateError);
      } else {
        console.log(`  ✓ Updated ${boutique.display_name}`);
        updatedCount++;
      }
    }
  }

  console.log(`✅ Updated ${updatedCount} boutique(s)`);
}

async function main() {
  console.log('🚀 Modern Premium v2.0 Color Migration');
  console.log('=====================================\n');
  
  await updatePlatformSettings();
  await updateBoutiqueColors();
  
  console.log('\n🎉 Migration complete!');
  console.log('   Refresh your browser to see the new colors.\n');
}

main().catch(console.error);
