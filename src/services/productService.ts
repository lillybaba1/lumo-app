
'use server';

import { dbAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';
import { Product, Category } from '@/lib/types';
import { products as mockProducts, categories as mockCategories } from '@/lib/mock-data';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

function serializeTimestamps(obj: Record<string, any>): Record<string, any> {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
        const value = obj[key];
        if (value instanceof Timestamp) {
            newObj[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newObj[key] = serializeTimestamps(value);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}


export async function getProducts(): Promise<Product[]> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        return mockProducts;
    }
    try {
        const productsCol = dbAdmin.collection('products').orderBy('name');
        const productSnapshot = await productsCol.get();
        if (productSnapshot.empty) {
            return [];
        }
        const productList = productSnapshot.docs.map(doc => {
            const data = doc.data();
            const serializedData = serializeTimestamps(data);
            return { id: doc.id, ...serializedData } as Product;
        });
        return productList;
    } catch (error) {
        console.error('Failed to fetch products from Firestore:', error);
        return mockProducts;
    }
}

export async function getProductById(id: string): Promise<Product | null> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        return mockProducts.find(p => p.id === id) || null;
    }
    try {
        const productDoc = await dbAdmin.collection('products').doc(id).get();
        if (!productDoc.exists) {
            return null;
        }
        const data = productDoc.data();
        if (!data) return null;

        const serializedData = serializeTimestamps(data);
        return { id: productDoc.id, ...serializedData } as Product;

    } catch (error) {
        console.error(`Failed to fetch product ${id} from Firestore:`, error);
        return null;
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

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        console.error('Failed to add product. Firebase Admin SDK not initialized.');
        throw new Error('Database not configured.');
    }
    try {
        const productRef = await dbAdmin.collection('products').add({
            ...product,
            createdAt: FieldValue.serverTimestamp(),
        });
        return { id: productRef.id, ...product };
    } catch (error) {
        console.error('Failed to add product to Firestore:', error);
        throw new Error('Could not save product.');
    }
}

export async function updateProduct(product: Product): Promise<void> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        console.error('Failed to update product. Firebase Admin SDK not initialized.');
        throw new Error('Database not configured.');
    }
    try {
        const { id, ...productData } = product;
        await dbAdmin.collection('products').doc(id).update({
            ...productData,
            updatedAt: FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error(`Failed to update product ${product.id} in Firestore:`, error);
        throw new Error('Could not update product.');
    }
}

export async function deleteProduct(id: string): Promise<void> {
    if (!isFirebaseAdminInitialized || !dbAdmin) {
        console.error('Failed to delete product. Firebase Admin SDK not initialized.');
        throw new Error('Database not configured.');
    }
    try {
        await dbAdmin.collection('products').doc(id).delete();
    } catch (error) {
        console.error(`Failed to delete product ${id} from Firestore:`, error);
        throw new Error('Could not delete product.');
    }
}
