
'use server';

import { z } from 'zod';
import { addProduct, updateProduct, deleteProduct as deleteProductFromDb } from '@/services/productService';
import { revalidatePath } from 'next/cache';
import { Product } from '@/lib/types';
import { redirect } from 'next/navigation';

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  imageUrl: z.string().url('Invalid image URL').min(1, 'Image is required'),
});

export async function saveProduct(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = productSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Validation failed. Please check the form fields.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, ...productData } = validatedFields.data;

  try {
    if (id) {
      await updateProduct({ id, ...productData });
    } else {
      await addProduct(productData);
    }
    revalidatePath('/admin/products');
  } catch (error) {
    console.error('Failed to save product:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
        success: false,
        message: `Failed to save product: ${errorMessage}`
    };
  }
  
  redirect('/admin/products');
}


export async function deleteProduct(productId: string) {
    try {
        await deleteProductFromDb(productId);
        revalidatePath('/admin/products');
        return { success: true, message: "Product deleted successfully." };
    } catch (error) {
        console.error("Error deleting product:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to delete product: ${errorMessage}` };
    }
}
