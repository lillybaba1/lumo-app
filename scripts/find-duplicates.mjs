import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findDuplicates() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, seller_id, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('All active products:');
  console.log('-------------------');
  data.forEach(p => {
    console.log(`ID: ${p.id}`);
    console.log(`Name: ${p.name}`);
    console.log(`Seller: ${p.seller_id}`);
    console.log(`Created: ${p.created_at}`);
    console.log('---');
  });

  // Find duplicates by name
  const nameCount = {};
  data.forEach(p => {
    const key = p.name.toLowerCase().trim();
    if (!nameCount[key]) nameCount[key] = [];
    nameCount[key].push(p);
  });

  console.log('\n\nDUPLICATES FOUND:');
  console.log('=================');
  let hasDupes = false;
  Object.entries(nameCount).forEach(([name, products]) => {
    if (products.length > 1) {
      hasDupes = true;
      console.log(`\n"${name}" appears ${products.length} times:`);
      products.forEach(p => {
        console.log(`  - ID: ${p.id} (created: ${p.created_at})`);
      });
    }
  });

  if (!hasDupes) {
    console.log('No duplicate products found!');
  }
}

findDuplicates();
