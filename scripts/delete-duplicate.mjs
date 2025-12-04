import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ID of the duplicate product to delete (the older one)
const duplicateId = process.argv[2];

if (!duplicateId) {
  console.error('Usage: node scripts/delete-duplicate.mjs <product-id>');
  process.exit(1);
}

async function deleteDuplicate() {
  console.log(`Deleting product: ${duplicateId}`);
  
  // First, delete related product_images
  const { error: imgError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', duplicateId);
  
  if (imgError) {
    console.error('Error deleting product images:', imgError);
  } else {
    console.log('Deleted product images');
  }
  
  // Delete product attributes
  const { error: attrError } = await supabase
    .from('product_attributes')
    .delete()
    .eq('product_id', duplicateId);
  
  if (attrError) {
    console.error('Error deleting product attributes:', attrError);
  } else {
    console.log('Deleted product attributes');
  }
  
  // Now delete the product
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', duplicateId);

  if (error) {
    console.error('Error deleting product:', error);
  } else {
    console.log('Successfully deleted duplicate product!');
  }
}

deleteDuplicate();
