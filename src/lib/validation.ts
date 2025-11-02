/**
 * Input validation schemas and utilities using Zod
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must be at most 100 characters');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')
  .trim();

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format')
  .optional();

export const urlSchema = z.string().url('Invalid URL format').optional();

export const positiveNumberSchema = z
  .number()
  .positive('Must be a positive number')
  .finite('Must be a finite number');

export const nonNegativeNumberSchema = z
  .number()
  .nonnegative('Must be a non-negative number')
  .finite('Must be a finite number');

export const priceSchema = z
  .number()
  .nonnegative('Price must be non-negative')
  .finite('Price must be a finite number')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

export const stockSchema = z
  .number()
  .int('Stock must be an integer')
  .nonnegative('Stock cannot be negative');

/**
 * Product validation schemas
 */

export const productIdSchema = z.string().min(1, 'Product ID is required');

export const createProductSchema = z.object({
  name: nameSchema,
  description: z.string().min(1, 'Description is required').max(5000),
  price: priceSchema,
  stock: stockSchema,
  category: z.string().min(1, 'Category is required'),
  categoryId: z.string().optional(),
  imageUrls: z.array(urlSchema).optional().default([]),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackInventory: z.boolean().optional(),
  reorderPoint: nonNegativeNumberSchema.optional(),
  reorderQuantity: positiveNumberSchema.optional(),
  weight: positiveNumberSchema.optional(),
  dimensions: z
    .object({
      length: positiveNumberSchema,
      width: positiveNumberSchema,
      height: positiveNumberSchema,
    })
    .optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: productIdSchema,
});

/**
 * Order validation schemas
 */

export const orderStatusSchema = z.enum([
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
]);

export const paymentMethodSchema = z.enum(['Wave Money', 'Cash on Delivery']);

export const paymentStatusSchema = z.enum(['Pending', 'Paid', 'Failed']);

export const createOrderSchema = z.object({
  customerName: nameSchema,
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  shippingAddress: z.string().min(10, 'Shipping address is required'),
  items: z
    .array(
      z.object({
        productId: productIdSchema,
        quantity: positiveNumberSchema.int(),
      })
    )
    .min(1, 'Order must have at least one item'),
  paymentMethod: paymentMethodSchema,
  couponCode: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * User validation schemas
 */

export const userRoleSchema = z.enum(['admin', 'customer']);

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: userRoleSchema.optional().default('customer'),
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
});

/**
 * Review validation schemas
 */

export const ratingSchema = z.number().int().min(1).max(5);

export const createReviewSchema = z.object({
  productId: productIdSchema,
  rating: ratingSchema,
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
});

/**
 * Coupon validation schemas
 */

export const couponTypeSchema = z.enum(['percentage', 'fixed']);

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, 'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores')
    .toUpperCase(),
  type: couponTypeSchema,
  value: positiveNumberSchema,
  minOrderAmount: nonNegativeNumberSchema.optional(),
  maxDiscount: positiveNumberSchema.optional(),
  usageLimit: positiveNumberSchema.int().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * File upload validation
 */

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().positive().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z.array(z.string()).default([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ]),
});

/**
 * Helper function to validate data against a schema
 * Throws ValidationError if validation fails
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Helper function to safely validate and return result with errors
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return { success: false, errors };
}
