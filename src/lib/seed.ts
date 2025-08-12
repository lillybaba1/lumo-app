
'use server';

import { dbAdmin } from './firebaseAdmin';
import { products as mockProducts, categories as mockCategories } from './mock-data';
import * as defaultPagesData from '@/data/pages.json';

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "https://placehold.co/1200x800.png",
  foregroundImage: "https://placehold.co/400x400.png",
};

const defaultPages = defaultPagesData;

export async function seedInitialData() {
    try {
        const seedMarkerRef = dbAdmin.collection('internal').doc('seedMarker');
        const seedMarkerSnap = await seedMarkerRef.get();

        if (seedMarkerSnap.exists) {
            return;
        }

        console.log("Seeding initial data into Firestore...");

        const batch = dbAdmin.batch();

        // Seed categories
        mockCategories.forEach(category => {
            const categoryRef = dbAdmin.collection('categories').doc(category.id);
            batch.set(categoryRef, { name: category.name });
        });

        // Seed products
        mockProducts.forEach(product => {
            const productRef = dbAdmin.collection('products').doc(product.id);
            batch.set(productRef, product);
        });

        // Seed default theme if it doesn't exist
        const themeRef = dbAdmin.collection('settings').doc('theme');
        batch.set(themeRef, defaultTheme);
        
        // Seed default pages if they don't exist
        const pagesRef = dbAdmin.collection('content').doc('pages');
        batch.set(pagesRef, defaultPages);
        
        // Set the seed marker
        batch.set(seedMarkerRef, { seeded: true, timestamp: new Date() });
        
        await batch.commit();

        console.log("Firestore seeded successfully.");
    } catch (error: any) {
        if (error.code === 'UNAVAILABLE' || (error.errorInfo && error.errorInfo.code === 'auth/configuration-not-found')) {
             console.warn("Could not connect to Firestore to seed data. This is likely because the database has not been created yet or the service account is not configured. Please create a Firestore database and set the FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
        } else {
            console.error("An unexpected error occurred during data seeding:", error);
        }
    }
}
