#!/usr/bin/env node

/**
 * Seed Categories Script
 *
 * Creates initial product categories in Firestore.
 * You can customize the categories array below to match your needs.
 *
 * Usage: node scripts/seed-categories.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  console.error('Please set it to the path of your service account key JSON file');
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Default categories for an e-commerce store
// Customize these to match your business needs
const categories = [
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Electronic devices, gadgets, and accessories',
    slug: 'electronics',
    imageUrl: '',
    featured: true,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Fashion and apparel for all occasions',
    slug: 'clothing',
    imageUrl: '',
    featured: true,
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'home-garden',
    name: 'Home & Garden',
    description: 'Home decor, furniture, and garden supplies',
    slug: 'home-garden',
    imageUrl: '',
    featured: false,
    order: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sports-outdoors',
    name: 'Sports & Outdoors',
    description: 'Sports equipment and outdoor gear',
    slug: 'sports-outdoors',
    imageUrl: '',
    featured: false,
    order: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'beauty-health',
    name: 'Beauty & Health',
    description: 'Beauty products, cosmetics, and health items',
    slug: 'beauty-health',
    imageUrl: '',
    featured: false,
    order: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'books-media',
    name: 'Books & Media',
    description: 'Books, movies, music, and games',
    slug: 'books-media',
    imageUrl: '',
    featured: false,
    order: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'toys-games',
    name: 'Toys & Games',
    description: 'Toys, games, and entertainment for all ages',
    slug: 'toys-games',
    imageUrl: '',
    featured: false,
    order: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car parts, accessories, and tools',
    slug: 'automotive',
    imageUrl: '',
    featured: false,
    order: 8,
    createdAt: new Date().toISOString(),
  },
];

async function seedCategories() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Seeding Product Categories');
  console.log('═══════════════════════════════════════════════\n');

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const category of categories) {
    try {
      const categoryRef = db.collection('categories').doc(category.id);
      const doc = await categoryRef.get();

      if (doc.exists) {
        // Update existing category (preserve imageUrl if already set)
        const existingData = doc.data();
        await categoryRef.update({
          name: category.name,
          description: category.description,
          slug: category.slug,
          featured: category.featured,
          order: category.order,
          ...(existingData.imageUrl ? {} : { imageUrl: category.imageUrl }),
          updatedAt: new Date().toISOString(),
        });
        console.log(`✓ Updated: ${category.name}`);
        updated++;
      } else {
        // Create new category
        await categoryRef.set(category);
        console.log(`✓ Created: ${category.name}`);
        created++;
      }
    } catch (error) {
      console.error(`✗ Error with ${category.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`✓ Seeding complete!`);
  console.log(`  Created: ${created} categories`);
  console.log(`  Updated: ${updated} categories`);
  if (errors > 0) {
    console.log(`  Errors: ${errors} categories`);
  }
  console.log(`─────────────────────────────────────\n`);
}

async function main() {
  try {
    await seedCategories();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();
