import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('products')
  .select(`
    id, 
    name, 
    image_urls,
    product_images (
      image_url,
      display_order,
      is_primary
    )
  `)
  .limit(3);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Products:', JSON.stringify(data, null, 2));
}
