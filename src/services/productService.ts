
'use server';

import { dbAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';
import { Product, Category } from '@/lib/types';
import { products as mockProducts, categories as mockCategories } from '@/lib/mock-data';

export async function getProducts(): Promise<Product[]> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        return mockProducts;
    }
    try {
        const productsCol = dbAdmin.collection('products');
        const productSnapshot = await productsCol.get();
        if (productSnapshot.empty) {
            return [];
        }
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        return productList;
    } catch (error) {
        console.error('Failed to fetch products from Firestore:', error);
        return mockProducts;
    }
}

export async function getCategories(): Promise<Category[]> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        return mockCategories;
    }
    try {
        const categoriesCol = dbAdmin.collection('categories');
        const categorySnapshot = await categoriesCol.get();
         if (categorySnapshot.empty) {
            return [];
        }
        const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        return categoryList;
    } catch (error) {
        console.error('Failed to fetch categories from Firestore:', error);
        return mockCategories;
    }
}
