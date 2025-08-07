
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Product, Category } from '@/lib/types';
import { products as mockProducts, categories as mockCategories } from '@/lib/mock-data';

export async function getProducts(): Promise<Product[]> {
    try {
        const productsCol = collection(db, 'products');
        const productSnapshot = await getDocs(productsCol);
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        if (productList.length === 0) {
            return mockProducts;
        }
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
        const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        if (categoryList.length === 0) {
            return mockCategories;
        }
        return categoryList;
    } catch (error) {
        console.warn('Failed to connect to Firestore. Falling back to mock categories.', error);
        return mockCategories;
    }
}
