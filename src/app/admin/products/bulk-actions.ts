'use server';

import { updateProduct, deleteProduct as deleteProductService } from '@/services/productService';
import { revalidatePath } from 'next/cache';

export async function bulkUpdateProducts(
  productIds: string[],
  updates: { price?: number; stock?: number; category?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const { getProductById } = await import('@/services/productService');

    const updatePromises = productIds.map(async (id) => {
      // Get current product and merge with updates
      const product = await getProductById(id);
      if (!product) {
        throw new Error(`Product ${id} not found`);
      }

      return updateProduct({
        ...product,
        ...updates,
      });
    });

    await Promise.all(updatePromises);

    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: `Successfully updated ${productIds.length} product(s)`,
    };
  } catch (error) {
    console.error('Bulk update failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update products',
    };
  }
}

export async function bulkDeleteProducts(
  productIds: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    const deletePromises = productIds.map((id) => deleteProductService(id));
    await Promise.all(deletePromises);

    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: `Successfully deleted ${productIds.length} product(s)`,
    };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete products',
    };
  }
}
