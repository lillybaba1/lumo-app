
'use server';

import { z } from 'zod';
import { addProduct, updateProduct, deleteProduct as deleteProductFromDb } from '@/services/productService';
import { saveProductImage, saveProductAttribute, getProductImages, getProductAttributes, deleteProductImage, deleteProductAttribute } from '@/services/productImageService';
import { revalidatePath } from 'next/cache';
import { CropData } from '@/lib/types';

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
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
  foregroundImages: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      return arg.split(',').filter(url => url.length > 0);
    }
    return arg;
  }, z.array(z.string().url()).optional()),
  backgroundImages: z.preprocess((arg) => {
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
    // Save product first
    let productId: string;
    if (id) {
      await updateProduct({ id, ...productData });
      productId = id;
    } else {
      const newProduct = await addProduct(productData);
      productId = newProduct.id;
    }

    // Parse crop data and attributes
    const imageCropDataStr = formData.get('imageCropData') as string;
    const attributesStr = formData.get('attributes') as string;

    // Save images with crop data to product_images table
    if (imageCropDataStr) {
      try {
        const imageCropData: Record<string, CropData> = JSON.parse(imageCropDataStr);

        // Get existing images to avoid duplicates
        const existingImages = await getProductImages(productId);
        const existingUrls = new Set(existingImages.map(img => img.imageUrl));

        // Save each image with its crop data
        const allImageUrls = [
          ...(productData.productImages || []),
          ...(productData.foregroundImages || []),
          ...(productData.backgroundImages || [])
        ];

        for (const url of allImageUrls) {
          // Skip if already exists
          if (existingUrls.has(url)) continue;

          const imageType = productData.productImages?.includes(url) ? 'product' :
                           productData.foregroundImages?.includes(url) ? 'foreground' : 'background';

          const crop = imageCropData[url];

          await saveProductImage({
            productId,
            imageUrl: url,
            imageType,
            cropX: crop?.x,
            cropY: crop?.y,
            cropWidth: crop?.width,
            cropHeight: crop?.height,
            displayOrder: allImageUrls.indexOf(url),
            isPrimary: imageType === 'product' && allImageUrls.indexOf(url) === 0,
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
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
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
