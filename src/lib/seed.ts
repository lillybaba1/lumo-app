
import { db } from './firebase';
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';
import { products as mockProducts, categories as mockCategories } from './mock-data';

export async function seedInitialData() {
    try {
        const seedMarkerRef = doc(db, 'internal', 'seedMarker');
        const seedMarkerSnap = await getDoc(seedMarkerRef);

        if (seedMarkerSnap.exists()) {
            // Firestore has been seeded, do nothing.
            return;
        }

        console.log("Seeding initial data into Firestore...");

        const batch = writeBatch(db);

        // Seed categories
        const categoriesCollection = collection(db, 'categories');
        mockCategories.forEach(category => {
            const categoryRef = doc(categoriesCollection, category.id);
            batch.set(categoryRef, { name: category.name });
        });

        // Seed products
        const productsCollection = collection(db, 'products');
        mockProducts.forEach(product => {
            const productRef = doc(productsCollection, product.id);
            batch.set(productRef, product);
        });
        
        // Set the seed marker
        batch.set(seedMarkerRef, { seeded: true, timestamp: new Date() });
        
        await batch.commit();

        console.log("Firestore seeded successfully.");
    } catch (error) {
        console.warn("Could not seed Firestore. This is likely because the database has not been created yet. Please create a Firestore database in your Firebase project.", error);
    }
}
