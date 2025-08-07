
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Product, Category } from '@/lib/types';
import { products as mockProducts, categories as mockCategories } from '@/lib/mock-data';

export async function getProducts(): Promise<Product[]> {
    try {
        const productsCol = collection(db, 'products');
        const productSnapshot = await getDocs(productsCol);
        if (productSnapshot.empty) {
            // Returning mock products because the db is either empty or not seeded
            return mockProducts;
        }
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        return productList;
    } catch (error) {
        console.warn('Failed to connect to Firestore. Falling back to mock products.', error);
        return mockProducts;
    }
}

export async function getCategories(): Promise<Category[]> {
    try {
        const categoriesCol = collection(db, 'categories');
        const categorySnapshot = await getDocs(categoriesCol);
         if (categorySnapshot.empty) {
            // Returning mock categories because the db is either empty or not seeded
            return mockCategories;
        }
        const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        return categoryList;
    } catch (error) {
        console.warn('Failed to connect to Firestore. Falling back to mock categories.', error);
        return mockCategories;
    }
}
