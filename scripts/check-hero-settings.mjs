/**
 * Check Hero Settings Diagnostic
 * Verifies what hero image is actually stored in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkHeroSettings() {
  console.log('🔍 Checking Hero Settings in Database...\n');

  try {
    // Get site_settings
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'storeConfig')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  No settings found in database');
        console.log('This means the app is using default settings only.\n');
        return;
      }
      throw error;
    }

    console.log('✅ Settings found in database\n');
    console.log('📊 Full Settings Object:');
    console.log('=' .repeat(60));
    console.log(JSON.stringify(data.value, null, 2));
    console.log('=' .repeat(60));

    console.log('\n🖼️  Hero Image Settings:');
    console.log('=' .repeat(60));
    console.log('Hero Heading:', data.value?.heroHeading || '(not set)');
    console.log('Hero Tagline:', data.value?.heroTagline || '(not set)');
    console.log('Hero Background Image:', data.value?.heroBackgroundImage || '(not set)');
    console.log('Hero Image Position:', data.value?.heroImageObjectPosition || '(not set)');
    console.log('=' .repeat(60));

    console.log('\n⏰ Last Updated:', data.updated_at || '(unknown)');

    // Check if hero image is using default
    const defaultHeroImage = '';
    if (data.value?.heroBackgroundImage === defaultHeroImage) {
      console.log('\n⚠️  WARNING: Hero image is set to the DEFAULT Unsplash image');
      console.log('If you uploaded a new image, it may not have been saved properly.');
    }

    // Check for uploaded images
    if (data.value?.heroBackgroundImage?.includes('supabase')) {
      console.log('\n✅ Hero image appears to be uploaded to Supabase storage');
    } else if (data.value?.heroBackgroundImage?.includes('unsplash')) {
      console.log('\n📸 Hero image is from Unsplash (external URL)');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkHeroSettings().catch(console.error);
