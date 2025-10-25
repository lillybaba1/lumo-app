"use server";

import { Category } from '@/lib/types';

export async function addCategory(category: Omit<Category, 'id'>): Promise<Category> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      const adminDb = dbAdmin();
      const ref = await adminDb.collection('categories').add({
        ...category,
        createdAt: new Date().toISOString(),
      });
      return { id: ref.id, ...category };
    }

    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    const ref = await addDoc(collection(db, 'categories'), {
      ...category,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, ...category };
  } catch (error) {
    console.error('Failed to add category to Firestore:', error);
    throw new Error('Could not save category.');
  }
}

export async function updateCategory(category: Category): Promise<void> {
  try {
    const { id, ...rest } = category;
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('categories').doc(id).set({
        ...rest,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return;
    }
    const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await updateDoc(doc(db, 'categories', id), {
      ...rest,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Failed to update category ${category.id} in Firestore:`, error);
    throw new Error('Could not update category.');
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      const { dbAdmin } = await import('@/lib/firebaseAdmin');
      await dbAdmin().collection('categories').doc(id).delete();
      return;
    }
    const { deleteDoc, doc } = await import('firebase/firestore');
    const { getClientDb } = await import('@/lib/firebaseClient');
    const db = getClientDb();
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    console.error(`Failed to delete category ${id} from Firestore:`, error);
    throw new Error('Could not delete category.');
  }
}
