/**
 * Debug Hero Image Issue
 * Comprehensive check of hero image from database to client
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

async function debugHeroIssue() {
  console.log('🔍 COMPREHENSIVE HERO IMAGE DEBUG\n');
  console.log('='.repeat(70));

  // 1. Check Database
  console.log('\n1️⃣  DATABASE CHECK');
  console.log('-'.repeat(70));

  const { data: settings, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'storeConfig')
    .single();

  if (error) {
    console.log('❌ Database Error:', error.message);
    return;
  }

  const heroImage = settings?.value?.heroBackgroundImage;
  console.log('Hero Image URL in Database:');
  console.log(heroImage);
  console.log('');

  if (heroImage?.includes('unsplash')) {
    console.log('⚠️  WARNING: Database has DEFAULT Unsplash image');
    console.log('This means your uploaded image was not saved properly!');
  } else if (heroImage?.includes('supabase')) {
    console.log('✅ Database has Supabase storage image (correct)');
  }

  // 2. Test API Endpoint
  console.log('\n2️⃣  API ENDPOINT CHECK');
  console.log('-'.repeat(70));

  try {
    const apiResponse = await fetch('http://localhost:3000/api/settings?t=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });

    const apiData = await apiResponse.json();
    const apiHeroImage = apiData?.heroBackgroundImage;

    console.log('Hero Image from API:');
    console.log(apiHeroImage);
    console.log('');

    if (apiHeroImage === heroImage) {
      console.log('✅ API matches Database');
    } else {
      console.log('❌ API MISMATCH - API returns different image than database!');
    }
  } catch (err) {
    console.log('❌ Cannot reach API:', err.message);
    console.log('Make sure dev server is running on port 3000');
  }

  // 3. Check Image Accessibility
  console.log('\n3️⃣  IMAGE ACCESSIBILITY CHECK');
  console.log('-'.repeat(70));

  if (heroImage) {
    try {
      const imageResponse = await fetch(heroImage);
      console.log('Image HTTP Status:', imageResponse.status);

      if (imageResponse.ok) {
        const contentType = imageResponse.headers.get('content-type');
        const contentLength = imageResponse.headers.get('content-length');
        console.log('✅ Image is accessible');
        console.log('Content-Type:', contentType);
        console.log('Size:', contentLength ? `${(parseInt(contentLength) / 1024).toFixed(2)} KB` : 'unknown');
      } else {
        console.log('❌ Image not accessible - HTTP', imageResponse.status);
      }
    } catch (err) {
      console.log('❌ Cannot fetch image:', err.message);
    }
  }

  // 4. Check for Admin Upload History
  console.log('\n4️⃣  RECENT UPLOADS CHECK');
  console.log('-'.repeat(70));

  try {
    const { data: files, error: storageError } = await supabase
      .storage
      .from('product-images')
      .list('hero', {
        limit: 5,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (storageError) {
      console.log('Cannot access storage:', storageError.message);
    } else if (files && files.length > 0) {
      console.log('Recent files uploaded to hero folder:');
      files.forEach((file, i) => {
        const url = `${supabaseUrl}/storage/v1/object/public/product-images/hero/${file.name}`;
        const isCurrent = heroImage?.includes(file.name);
        console.log(`${i + 1}. ${file.name} ${isCurrent ? '← CURRENT' : ''}`);
        console.log(`   Created: ${file.created_at}`);
        console.log(`   Size: ${(file.metadata?.size / 1024).toFixed(2)} KB`);
        console.log(`   URL: ${url}`);
        console.log('');
      });
    } else {
      console.log('No files found in hero folder');
    }
  } catch (err) {
    console.log('Error checking uploads:', err.message);
  }

  // 5. Recommendations
  console.log('\n5️⃣  RECOMMENDATIONS');
  console.log('-'.repeat(70));

  if (heroImage?.includes('unsplash')) {
    console.log('🔧 ACTION REQUIRED:');
    console.log('1. Go to: http://localhost:3000/admin/appearance');
    console.log('2. Upload a new hero image');
    console.log('3. Click "Save Changes" button');
    console.log('4. Hard refresh your browser (Ctrl+Shift+R)');
  } else if (heroImage?.includes('supabase')) {
    console.log('✅ Hero image is correctly saved in database');
    console.log('');
    console.log('If you still see the old image:');
    console.log('1. Clear browser cache completely');
    console.log('2. Try in incognito/private window');
    console.log('3. Check browser DevTools → Network tab → Disable cache');
    console.log('4. Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)');
  }

  console.log('\n' + '='.repeat(70));
}

debugHeroIssue().catch(console.error);
