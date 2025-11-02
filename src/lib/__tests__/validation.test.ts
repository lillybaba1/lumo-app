import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  priceSchema,
  stockSchema,
  createProductSchema,
  createOrderSchema,
  validate,
  safeValidate,
} from '../validation';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid password', () => {
      const result = passwordSchema.safeParse('password123');
      expect(result.success).toBe(true);
    });

    it('should reject password too short', () => {
      const result = passwordSchema.safeParse('12345');
      expect(result.success).toBe(false);
    });

    it('should reject password too long', () => {
      const result = passwordSchema.safeParse('a'.repeat(101));
      expect(result.success).toBe(false);
    });
  });

  describe('priceSchema', () => {
    it('should accept valid price', () => {
      const result = priceSchema.safeParse(19.99);
      expect(result.success).toBe(true);
    });

    it('should reject negative price', () => {
      const result = priceSchema.safeParse(-10);
      expect(result.success).toBe(false);
    });

    it('should accept zero price', () => {
      const result = priceSchema.safeParse(0);
      expect(result.success).toBe(true);
    });
  });

  describe('stockSchema', () => {
    it('should accept valid stock', () => {
      const result = stockSchema.safeParse(100);
      expect(result.success).toBe(true);
    });

    it('should reject decimal stock', () => {
      const result = stockSchema.safeParse(10.5);
      expect(result.success).toBe(false);
    });

    it('should reject negative stock', () => {
      const result = stockSchema.safeParse(-5);
      expect(result.success).toBe(false);
    });
  });

  describe('createProductSchema', () => {
    const validProduct = {
      name: 'Test Product',
      description: 'A test product description',
      price: 29.99,
      stock: 50,
      category: 'Electronics',
    };

    it('should accept valid product', () => {
      const result = createProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should reject product without name', () => {
      const { name, ...productWithoutName } = validProduct;
      const result = createProductSchema.safeParse(productWithoutName);
      expect(result.success).toBe(false);
    });

    it('should reject product with invalid price', () => {
      const invalidProduct = { ...validProduct, price: -10 };
      const result = createProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should accept product with optional fields', () => {
      const productWithOptionals = {
        ...validProduct,
        sku: 'SKU123',
        barcode: '1234567890',
        weight: 1.5,
      };
      const result = createProductSchema.safeParse(productWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('createOrderSchema', () => {
    const validOrder = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      shippingAddress: '123 Main St, City, State 12345',
      items: [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ],
      paymentMethod: 'Cash on Delivery' as const,
    };

    it('should accept valid order', () => {
      const result = createOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should reject order without items', () => {
      const { items, ...orderWithoutItems } = validOrder;
      const result = createOrderSchema.safeParse(orderWithoutItems);
      expect(result.success).toBe(false);
    });

    it('should reject order with empty items array', () => {
      const orderWithEmptyItems = { ...validOrder, items: [] };
      const result = createOrderSchema.safeParse(orderWithEmptyItems);
      expect(result.success).toBe(false);
    });

    it('should reject order with invalid email', () => {
      const invalidOrder = { ...validOrder, customerEmail: 'invalid-email' };
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject order with short address', () => {
      const invalidOrder = { ...validOrder, shippingAddress: 'Short' };
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });

  describe('validate helper', () => {
    it('should return validated data on success', () => {
      const data = validate(emailSchema, 'test@example.com');
      expect(data).toBe('test@example.com');
    });

    it('should throw on validation failure', () => {
      expect(() => validate(emailSchema, 'invalid-email')).toThrow();
    });
  });

  describe('safeValidate helper', () => {
    it('should return success result with data', () => {
      const result = safeValidate(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should return error result with messages', () => {
      const result = safeValidate(emailSchema, 'invalid-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });
});
