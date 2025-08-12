
import { db } from './firebase';
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';
import { products as mockProducts, categories as mockCategories } from './mock-data';
import { PageContent } from './types';

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "https://placehold.co/1200x800.png",
  foregroundImage: "",
};

const defaultPages: Record<string, PageContent> = {
  about: { title: 'About Us', content: 'Welcome to Lumo! We are passionate about providing the best products and customer service.' },
  shipping: { title: 'Shipping Policy', content: 'We offer free shipping on all orders over $50. Orders are typically processed within 2-3 business days.' },
  contact: { title: 'Contact Us', content: 'Have questions? Email us at support@lumo.com or call us at (123) 456-7890.' },
  faq: { title: 'FAQ', content: 'Q: How do I return an item? A: Please contact our support team for a return authorization.' },
  policy: { title: 'Return Policy', content: 'We accept returns within 30 days of purchase for a full refund.' },
};


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

        // Seed default theme
        const themeRef = doc(db, 'settings', 'theme');
        batch.set(themeRef, defaultTheme);
        
        // Seed default pages
        const pagesRef = doc(db, 'content', 'pages');
        batch.set(pagesRef, defaultPages);
        
        // Set the seed marker
        batch.set(seedMarkerRef, { seeded: true, timestamp: new Date() });
        
        await batch.commit();

        console.log("Firestore seeded successfully.");
    } catch (error) {
        console.warn("Could not seed Firestore. This is likely because the database has not been created yet. Please create a Firestore database in your Firebase project.", error);
    }
}
