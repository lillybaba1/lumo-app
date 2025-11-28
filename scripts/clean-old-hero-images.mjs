/**
 * Clean Old Hero Images
 * Removes old hero image files from Supabase storage, keeping only the current one
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

async function cleanOldHeroImages() {
  console.log('🧹 Cleaning Old Hero Images...\n');

  // 1. Get current hero image from settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'storeConfig')
    .single();

  const currentHeroUrl = settings?.value?.heroBackgroundImage;

  if (!currentHeroUrl) {
    console.log('❌ No current hero image found in settings');
    return;
  }

  // Extract filename from URL
  const currentFilename = currentHeroUrl.split('/').pop()?.split('?')[0];
  console.log('Current hero image:', currentFilename);
  console.log('');

  // 2. List all files in hero folder
  const { data: files, error } = await supabase
    .storage
    .from('product-images')
    .list('hero', {
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) {
    console.log('❌ Error listing files:', error.message);
    return;
  }

  if (!files || files.length === 0) {
    console.log('No files found in hero folder');
    return;
  }

  console.log(`Found ${files.length} files in hero folder:\n`);

  // 3. Identify old files to delete
  const filesToDelete = files.filter(f => f.name !== currentFilename);

  if (filesToDelete.length === 0) {
    console.log('✅ No old files to delete. Storage is clean!');
    return;
  }

  console.log(`Files to delete (${filesToDelete.length}):`);
  filesToDelete.forEach((file, i) => {
    console.log(`${i + 1}. ${file.name}`);
    console.log(`   Created: ${file.created_at}`);
    console.log(`   Size: ${(file.metadata?.size / 1024).toFixed(2)} KB`);
  });

  console.log('\n⚠️  Are you sure you want to delete these files?');
  console.log('This action cannot be undone!\n');

  // Actually delete the files
  console.log('\n🗑️  Deleting old files...\n');

  for (const file of filesToDelete) {
    const { error: deleteError } = await supabase
      .storage
      .from('product-images')
      .remove([`hero/${file.name}`]);

    if (deleteError) {
      console.log(`❌ Failed to delete ${file.name}:`, deleteError.message);
    } else {
      console.log(`✅ Deleted ${file.name}`);
    }
  }

  console.log('\n✅ Cleanup complete!');
  console.log(`\nRemoved ${filesToDelete.length} old hero images.`);
  console.log(`Kept 1 current hero image: ${currentFilename}`);
}

cleanOldHeroImages().catch(console.error);
