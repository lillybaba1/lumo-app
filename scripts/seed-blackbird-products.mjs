#!/usr/bin/env node

/**
 * Seed 30 test products for the Blackbird seller account
 * across different categories
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // 1. Find blackbird's business account
  console.log('🔍 Looking for Blackbird business account...');
  
  const { data: businesses, error: bizErr } = await supabase
    .from('business_accounts')
    .select('id, business_name, owner_user_id, status')
    .ilike('business_name', '%blackbird%');

  if (bizErr) {
    console.error('❌ Error fetching business accounts:', bizErr);
    process.exit(1);
  }

  if (!businesses || businesses.length === 0) {
    // Try finding by user name
    console.log('  Not found by business name, searching by user name...');
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id, name, email, role, business_account_id')
      .or('name.ilike.%blackbird%,email.ilike.%blackbird%');
    
    if (userErr || !users?.length) {
      console.error('❌ Could not find Blackbird user. Users found:', users);
      // List all business accounts for debugging
      const { data: allBiz } = await supabase
        .from('business_accounts')
        .select('id, business_name, owner_user_id, status')
        .limit(20);
      console.log('All business accounts:', allBiz);
      process.exit(1);
    }
    
    console.log('  Found user:', users[0]);
    
    // Look up their business account
    if (users[0].business_account_id) {
      const { data: biz } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('id', users[0].business_account_id)
        .single();
      
      if (biz) {
        businesses.push(biz);
      }
    } else {
      // Find by owner_user_id
      const { data: bizByOwner } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('owner_user_id', users[0].id);
      
      if (bizByOwner?.length) {
        businesses.push(...bizByOwner);
      }
    }
  }

  if (!businesses.length) {
    console.error('❌ Could not find any business account for Blackbird');
    process.exit(1);
  }

  const sellerId = businesses[0].id;
  console.log(`✅ Found business: "${businesses[0].business_name}" (ID: ${sellerId}, Status: ${businesses[0].status})`);

  // 2. Get all categories
  console.log('\n🔍 Fetching categories...');
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  if (catErr || !categories?.length) {
    console.error('❌ Error fetching categories:', catErr);
    console.log('No categories found. Creating default categories...');
    
    const defaultCategories = [
      { name: 'Electronics', description: 'Electronic devices and gadgets' },
      { name: 'Fashion', description: 'Clothing, shoes, and accessories' },
      { name: 'Home & Garden', description: 'Home decor and garden supplies' },
      { name: 'Beauty', description: 'Beauty and personal care products' },
      { name: 'Sports', description: 'Sports equipment and activewear' },
      { name: 'Books', description: 'Books, ebooks, and reading materials' },
      { name: 'Toys & Games', description: 'Toys, games, and entertainment' },
      { name: 'Health', description: 'Health and wellness products' },
      { name: 'Automotive', description: 'Auto parts and accessories' },
      { name: 'Food & Drinks', description: 'Food, beverages, and groceries' },
    ];

    const { data: newCats, error: newCatErr } = await supabase
      .from('categories')
      .insert(defaultCategories)
      .select('id, name');

    if (newCatErr) {
      console.error('❌ Failed to create categories:', newCatErr);
      process.exit(1);
    }

    categories.push(...newCats);
  }

  console.log(`✅ Found ${categories.length} categories:`, categories.map(c => c.name).join(', '));

  // 3. Define 30 products spread across categories
  const productsByCategory = {
    'Electronics': [
      { name: 'Wireless Bluetooth Earbuds Pro', description: 'Premium wireless earbuds with active noise cancellation, 30-hour battery life, and IPX5 water resistance. Crystal-clear audio with deep bass.', price: 79.99, stock: 45 },
      { name: 'Smart LED Desk Lamp', description: 'Adjustable LED desk lamp with 5 brightness levels, 3 color temperatures, USB charging port, and touch controls. Perfect for home office.', price: 34.99, stock: 60 },
      { name: 'Portable Power Bank 20000mAh', description: 'High-capacity portable charger with dual USB-C ports, fast charging support, LED display, and compact design for on-the-go charging.', price: 29.99, stock: 100 },
      { name: 'Mechanical Gaming Keyboard RGB', description: 'Full-size mechanical keyboard with customizable RGB lighting, cherry MX switches, programmable keys, and aircraft-grade aluminum frame.', price: 89.99, stock: 30 },
    ],
    'Fashion': [
      { name: 'Classic Denim Jacket', description: 'Timeless denim jacket crafted from premium cotton with a modern slim fit. Features button closure, chest pockets, and adjustable waist tabs.', price: 65.00, stock: 40 },
      { name: 'Handwoven Silk Scarf', description: 'Luxurious handwoven silk scarf with vibrant African-inspired patterns. Versatile accessory for any outfit. 100% pure mulberry silk.', price: 45.00, stock: 25 },
      { name: 'Leather Crossbody Bag', description: 'Genuine leather crossbody bag with adjustable strap, multiple compartments, and gold-tone hardware. Handcrafted with attention to detail.', price: 120.00, stock: 15 },
      { name: 'Unisex Canvas Sneakers', description: 'Comfortable canvas sneakers with vulcanized rubber sole, cushioned insole, and classic lace-up design. Available in multiple colors.', price: 42.00, stock: 80 },
    ],
    'Home & Garden': [
      { name: 'Bamboo Plant Stand Set', description: 'Set of 3 bamboo plant stands in different heights. Modern minimalist design, sturdy construction, and eco-friendly material. Perfect for indoor plants.', price: 55.00, stock: 35 },
      { name: 'Scented Soy Candle Collection', description: 'Set of 4 hand-poured soy candles with natural essential oils. Scents include lavender, vanilla, eucalyptus, and citrus. Burns for 40+ hours each.', price: 38.00, stock: 50 },
      { name: 'Ceramic Indoor Herb Garden Kit', description: 'Complete indoor herb garden kit with 3 ceramic pots, drainage trays, organic soil, and seeds for basil, mint, and rosemary.', price: 32.00, stock: 45 },
    ],
    'Beauty': [
      { name: 'Organic Face Serum Set', description: 'Premium organic skincare set with Vitamin C serum, hyaluronic acid moisturizer, and retinol night serum. Cruelty-free and vegan formula.', price: 58.00, stock: 55 },
      { name: 'Natural Hair Oil Collection', description: 'Set of 3 natural hair oils: argan, coconut, and jojoba. Cold-pressed and unrefined for maximum benefits. Promotes healthy hair growth.', price: 35.00, stock: 70 },
      { name: 'Bamboo Makeup Brush Set', description: '12-piece professional makeup brush set with eco-friendly bamboo handles and synthetic bristles. Includes travel case.', price: 28.00, stock: 90 },
    ],
    'Sports': [
      { name: 'Yoga Mat Premium Non-Slip', description: 'Extra thick 6mm yoga mat with non-slip surface, alignment markers, and carrying strap. Made from eco-friendly TPE material.', price: 39.99, stock: 65 },
      { name: 'Resistance Bands Set', description: 'Complete set of 5 resistance bands with different tension levels, door anchor, handles, and ankle straps. Perfect for home workouts.', price: 24.99, stock: 120 },
      { name: 'Stainless Steel Water Bottle', description: 'Double-walled insulated water bottle, 32oz capacity. Keeps drinks cold 24hrs or hot 12hrs. BPA-free with leak-proof lid.', price: 27.99, stock: 85 },
    ],
    'Books': [
      { name: 'African Art History Hardcover', description: 'Comprehensive illustrated guide to African art from ancient times to contemporary. Features over 300 full-color photographs and expert commentary.', price: 45.00, stock: 30 },
      { name: 'Modern Business Strategy Guide', description: 'Best-selling business book covering digital transformation, e-commerce strategies, and entrepreneurship in the modern age. 2024 updated edition.', price: 22.00, stock: 50 },
    ],
    'Toys & Games': [
      { name: 'Wooden Building Blocks Set', description: 'Set of 100 colorful wooden building blocks in various shapes. Non-toxic paint, smooth edges, and comes in a sturdy storage box. Ages 3+.', price: 34.00, stock: 40 },
      { name: 'Strategy Board Game Collection', description: 'Premium board game set including chess, checkers, and backgammon with solid wood board and weighted pieces. Perfect family gift.', price: 48.00, stock: 25 },
    ],
    'Health': [
      { name: 'Digital Smart Scale', description: 'Bluetooth-enabled smart scale with body composition analysis. Tracks weight, BMI, muscle mass, and body fat. Syncs with health apps.', price: 44.99, stock: 55 },
      { name: 'Essential Oil Diffuser', description: 'Ultrasonic aromatherapy diffuser with 7 LED color options, timer settings, and auto shut-off. 300ml capacity covers up to 300 sq ft.', price: 32.00, stock: 70 },
      { name: 'Organic Green Tea Sampler', description: 'Collection of 6 premium organic green teas from around the world. Includes matcha, sencha, jasmine, gunpowder, and more. 60 tea bags total.', price: 26.00, stock: 100 },
    ],
    'Automotive': [
      { name: 'Car Phone Mount Universal', description: 'Universal car phone mount with strong suction cup, 360° rotation, and one-touch release. Compatible with all smartphones up to 7 inches.', price: 18.99, stock: 150 },
      { name: 'LED Car Interior Light Kit', description: '4-strip LED car interior lighting kit with app control, music sync, and 16 million color options. Easy installation with adhesive strips.', price: 24.99, stock: 80 },
    ],
    'Food & Drinks': [
      { name: 'Artisan Coffee Bean Selection', description: 'Premium selection of 3 single-origin coffee beans: Ethiopian Yirgacheffe, Colombian Supremo, and Kenyan AA. Freshly roasted, whole bean, 250g each.', price: 42.00, stock: 60 },
      { name: 'Gourmet Spice Collection', description: 'Set of 12 organic gourmet spices in glass jars with bamboo rack. Includes turmeric, smoked paprika, cumin, and more. Perfect for home chefs.', price: 55.00, stock: 35 },
    ],
  };

  // Placeholder product images using picsum.photos (reliable placeholder service)
  const getPlaceholderImages = (index) => {
    const seed = 100 + index;
    return [
      `https://picsum.photos/seed/product${seed}/800/800`,
      `https://picsum.photos/seed/product${seed}b/800/800`,
    ];
  };

  // 4. Insert products
  console.log('\n📦 Creating 30 products for Blackbird...');
  let created = 0;
  let failed = 0;
  let productIndex = 0;

  for (const [categoryName, products] of Object.entries(productsByCategory)) {
    // Find matching category
    const category = categories.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
      console.log(`  ⚠️  Category "${categoryName}" not found, looking for closest match...`);
      // Try partial match
      const partial = categories.find(c => 
        c.name.toLowerCase().includes(categoryName.toLowerCase().split(' ')[0]) ||
        categoryName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
      );
      
      if (!partial) {
        console.log(`  ❌ No matching category for "${categoryName}", creating it...`);
        const { data: newCat, error: newCatErr } = await supabase
          .from('categories')
          .insert({ name: categoryName, description: `${categoryName} products` })
          .select('id, name')
          .single();
        
        if (newCatErr) {
          console.error(`  ❌ Failed to create category "${categoryName}":`, newCatErr);
          failed += products.length;
          continue;
        }
        categories.push(newCat);
        var categoryId = newCat.id;
      } else {
        console.log(`  📂 Using "${partial.name}" for "${categoryName}"`);
        var categoryId = partial.id;
      }
    } else {
      var categoryId = category.id;
    }

    for (const product of products) {
      productIndex++;
      const images = getPlaceholderImages(productIndex);
      const sku = `BB-${categoryName.substring(0, 3).toUpperCase()}-${String(productIndex).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category_id: categoryId,
          seller_id: sellerId,
          image_urls: images,
          product_images: images,
          foreground_images: [],
          background_images: [],
          sku: sku,
          track_inventory: true,
          reorder_point: 5,
          reorder_quantity: 20,
          stock_by_location: {},
          is_active: true,
        })
        .select('id, name')
        .single();

      if (error) {
        console.error(`  ❌ Failed to create "${product.name}":`, error.message);
        failed++;
      } else {
        console.log(`  ✅ [${productIndex}/30] ${data.name} ($${product.price}) → ${categoryName}`);
        created++;
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Created: ${created}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📂 Categories used: ${Object.keys(productsByCategory).length}`);
  console.log(`  🏪 Seller: ${businesses[0].business_name} (${sellerId})`);
  
  if (created > 0) {
    console.log(`\n🎉 Done! Products are now visible in Blackbird's store.`);
  }
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
