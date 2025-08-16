'use server';

import { db } from '@/lib/firebaseClient';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { Product, Category } from '@/lib/types';
import { products as mockProducts, categories as mockCategories } from '@/lib/mock-data';

function serializeTimestamps(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value instanceof Timestamp) {
      out[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = serializeTimestamps(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), orderBy('name'));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data());
      return { id: d.id, ...data } as Product;
    });
  } catch (error) {
    console.error('Failed to fetch products from Firestore:', error);
    return mockProducts;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const ref = doc(db, 'products', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = serializeTimestamps(snap.data());
    return { id: snap.id, ...data } as Product;
  } catch (error) {
    console.error(`Failed to fetch product ${id} from Firestore:`, error);
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) return [];
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }));
  } catch (error) {
    console.error('Failed to fetch categories from Firestore:', error);
    return mockCategories;
  }
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
  try {
    const ref = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, ...product, imageUrls: product.imageUrls };
  } catch (error) {
    console.error('Failed to add product to Firestore:', error);
    throw new Error('Could not save product.');
  }
}

export async function updateProduct(product: Product): Promise<void> {
  try {
    const { id, ...rest } = product;
    await updateDoc(doc(db, 'products', id), {
      ...rest,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Failed to update product ${product.id} in Firestore:`, error);
    throw new Error('Could not update product.');
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    console.error(`Failed to delete product ${id} from Firestore:`, error);
    throw new Error('Could not delete product.');
  }
}
