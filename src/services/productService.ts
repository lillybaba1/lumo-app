"use server";

// Note: avoid importing the client-only `db` at module top-level which
// would throw on server runtime. We'll dynamically use either the
// Admin SDK (server) or the client SDK (browser) inside functions.
import { Timestamp } from 'firebase/firestore';
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
    // Server: try Admin SDK first (preferred in server environment).
    if (typeof window === 'undefined') {
      try {
        const { dbAdmin } = await import('@/lib/firebaseAdmin');
        const adminDb = dbAdmin();
        // admin.firestore() Query API
        const snap = await adminDb.collection('products').orderBy('name').get();
        if (!snap || snap.empty) return mockProducts;
        return snap.docs.map((d: any) => {
          const data = serializeTimestamps(d.data() || {});
          const product = { id: d.id, ...data } as Product;
          if (!product.categoryId && typeof product.category === 'string') {
            product.categoryId = product.category.toLowerCase().replace(/\s+/g, '-');
          }
          return product;
        });
      } catch (adminErr) {
        // Admin SDK not available (no credentials) — fall back to mock data
        console.error('Admin Firestore not available on server:', adminErr);
        return mockProducts;
      }
    }

    // Client-side: dynamically import client Firestore helpers
    const [{ collection, getDocs, query, orderBy }, { getClientDb }] = await Promise.all([
      await import('firebase/firestore'),
      await import('@/lib/firebaseClient')
    ]);
    const db = getClientDb();
    const q = query(collection(db, 'products'), orderBy('name'));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    return snap.docs.map(d => {
      const data = serializeTimestamps(d.data());
      const product = { id: d.id, ...data } as Product;
      if (!product.categoryId && typeof product.category === 'string') {
        product.categoryId = product.category.toLowerCase().replace(/\s+/g, '-');
      }
      return product;
    });
  } catch (error) {
    console.error('Failed to fetch products from Firestore:', error);
    return mockProducts;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      try {
        const adminDb = dbAdmin();
        const snap = await adminDb.collection('products').doc(id).get();
  if (!snap.exists) return null;
  const data = serializeTimestamps(snap.data() || {});
        return { id: snap.id, ...data } as Product;
      } catch (adminErr) {
        console.error(`Admin DB error fetching product ${id}:`, adminErr);
        return null;
      }
    }

  const { getDoc, doc } = await import('firebase/firestore');
  const { getClientDb } = await import('@/lib/firebaseClient');
  const db = getClientDb();
  const ref = doc(db, 'products', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = serializeTimestamps(snap.data() || {});
    return { id: snap.id, ...data } as Product;
  } catch (error) {
    console.error(`Failed to fetch product ${id} from Firestore:`, error);
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    if (typeof window === 'undefined') {
      try {
        const { dbAdmin } = await import('@/lib/firebaseAdmin');
        const adminDb = dbAdmin();
        const snap = await adminDb.collection('categories').get();
        if (!snap || snap.empty) return mockCategories;
        return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }));
      } catch (adminErr) {
        console.error('Admin Firestore not available on server:', adminErr);
        return mockCategories;
      }
    }

    const [{ getDocs, collection }, { getClientDb }] = await Promise.all([
      await import('firebase/firestore'),
      await import('@/lib/firebaseClient')
    ]);
    const db = getClientDb();
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
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const adminDb = dbAdmin();
      const ref = await adminDb.collection('products').add({ ...product, createdAt: new Date() });
      return { id: ref.id, ...product, imageUrls: product.imageUrls } as Product;
    }

    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const ref = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, ...product, imageUrls: product.imageUrls } as Product;
  } catch (error) {
    console.error('Failed to add product to Firestore:', error);
    throw new Error('Could not save product.');
  }
}

export async function updateProduct(product: Product): Promise<void> {
  try {
    const { id, ...rest } = product;
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('products').doc(id).set({ ...rest, updatedAt: new Date() }, { merge: true });
      return;
    }
    const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
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
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('products').doc(id).delete();
      return;
    }
    const { deleteDoc, doc } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    console.error(`Failed to delete product ${id} from Firestore:`, error);
    throw new Error('Could not delete product.');
  }
}
