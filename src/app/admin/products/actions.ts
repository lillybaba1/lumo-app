
'use server';

import { z } from 'zod';
import { addProduct, updateProduct, deleteProduct as deleteProductFromDb, getProductById } from '@/services/productService';
import { saveProductImage, saveProductAttribute, getProductImages, getProductAttributes, deleteProductImage, deleteProductAttribute } from '@/services/productImageService';
import { revalidatePath } from 'next/cache';
import { CropData } from '@/lib/types';
import { requireAuth } from '@/lib/auth-roles';

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  sellerId: z.string().optional(),
  imageUrls: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      return arg.split(',').filter(url => url.length > 0);
    }
    return arg;
  }, z.array(z.string().url()).optional()),
  productImages: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      return arg.split(',').filter(url => url.length > 0);
    }
    return arg;
  }, z.array(z.string().url()).optional()),
}).refine((data) => {
  // Ensure at least one product image exists (either in imageUrls or productImages)
  const hasImages = (data.imageUrls && data.imageUrls.length > 0) || (data.productImages && data.productImages.length > 0);
  return hasImages;
}, {
  message: 'At least one product image is required',
  path: ['productImages'],
});

type SaveProductState = {
  success: boolean;
  message: string;
  errors?: z.ZodError['formErrors']['fieldErrors'] | null;
}

export async function saveProduct(prevState: SaveProductState, formData: FormData): Promise<SaveProductState> {
  const rawFormData = Object.fromEntries(formData.entries());

  // Debug logging
  console.log('[Product Save] Raw form data:', {
    name: rawFormData.name,
    price: rawFormData.price,
    imageUrls: rawFormData.imageUrls,
    productImages: rawFormData.productImages,
    category: rawFormData.category,
  });

  const validatedFields = productSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error('[Product Save] Validation failed:', validatedFields.error.flatten().fieldErrors);
    console.error('[Product Save] Full validation errors:', validatedFields.error.errors);

    // Create a user-friendly error message
    const errors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
      .join('; ');

    return {
      success: false,
      message: `Validation failed: ${errorMessages}`,
      errors: errors,
    };
  }

  const { id, ...productData } = validatedFields.data;

  try {
    const user = await requireAuth();
    let sellerId = productData.sellerId;

    // Save product first
    let productId: string;
    if (id) {
      if (!sellerId) {
        const existingProduct = await getProductById(id);
        if (!existingProduct) {
          return { success: false, message: 'Product not found' };
        }
        sellerId = existingProduct.sellerId;
      }
      await updateProduct({ 
        id, 
        ...productData, 
        sellerId,
        imageUrls: productData.imageUrls || [],
        productImages: productData.productImages || []
      });
      productId = id;
    } else {
      if (!sellerId) {
        if (user.businessAccountId) {
          sellerId = user.businessAccountId;
        } else {
          return { success: false, message: 'You must have a business account to create products.' };
        }
      }
      const newProduct = await addProduct({ 
        ...productData, 
        sellerId,
        imageUrls: productData.imageUrls || [],
        productImages: productData.productImages || []
      });
      productId = newProduct.id;
    }

    // Parse crop data and attributes
    const imageCropDataStr = formData.get('imageCropData') as string;
    const attributesStr = formData.get('attributes') as string;

        // Save images with crop data to product_images table and clean up removed ones
        if (imageCropDataStr) {
          try {
            const imageCropData: Record<string, CropData> = JSON.parse(imageCropDataStr);

            // Get existing images for this product
            const existingImages = await getProductImages(productId);
            const existingByUrl = new Map(existingImages.map(img => [img.imageUrl, img]));

            // Images to keep and their order/primary flag
            const allImageUrls = [...(productData.productImages || [])];

            // Delete images that are no longer present
            for (const existing of existingImages) {
              if (!allImageUrls.includes(existing.imageUrl) && existing.id) {
                await deleteProductImage(existing.id);
              }
            }

            // Upsert images with latest ordering/primary/crop
            for (const [index, url] of allImageUrls.entries()) {
              const imageType = 'product';
              const crop = imageCropData[url];
              const existing = existingByUrl.get(url);

              await saveProductImage({
                id: existing?.id,
                productId,
                imageUrl: url,
                imageType,
                cropX: crop?.x,
                cropY: crop?.y,
                cropWidth: crop?.width,
                cropHeight: crop?.height,
                displayOrder: index,
                isPrimary: index === 0,
              });
            }
          } catch (error) {
            console.error('Failed to save image crop data:', error);
          }
        }

    // Save product attributes
    if (attributesStr) {
      try {
        const attributes = JSON.parse(attributesStr);

        // Get existing attributes to avoid duplicates
        const existingAttributes = await getProductAttributes(productId);

        // Delete removed attributes
        for (const existing of existingAttributes) {
          const stillExists = attributes.some((attr: any) =>
            attr.attributeName === existing.attributeName &&
            attr.attributeValue === existing.attributeValue
          );
          if (!stillExists && existing.id) {
            await deleteProductAttribute(existing.id);
          }
        }

        // Save new/updated attributes
        for (const attr of attributes) {
          await saveProductAttribute({
            productId,
            attributeName: attr.attributeName,
            attributeValue: attr.attributeValue,
            attributeGroup: attr.attributeGroup,
            displayOrder: attr.displayOrder || 0,
            isVariant: attr.isVariant || false,
            priceModifier: attr.priceModifier,
            stockModifier: attr.stockModifier,
          });
        }
      } catch (error) {
        console.error('Failed to save product attributes:', error);
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');

    return { success: true, message: 'Product saved successfully.' };

  } catch (error) {
    console.error('Failed to save product:', error);

    // Provide detailed error information
    let errorMessage = 'An unknown error occurred.';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }

    // Log detailed error for debugging
    console.error('Detailed error:', {
      message: errorMessage,
      details: errorDetails,
      error: error
    });

    return {
        success: false,
        message: `Failed to save product: ${errorMessage}`
    };
  }
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
