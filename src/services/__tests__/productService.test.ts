import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addProduct, updateProduct, deleteProduct } from '../productService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Mock the supabaseAdmin module
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe('Product Service Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addProduct', () => {
    it('should handle foreign key constraint violation (invalid category)', async () => {
      const mockError = {
        code: '23503',
        message: 'insert or update on table "products" violates foreign key constraint "products_category_id_fkey"',
        details: 'Key (category_id)=(invalid-id) is not present in table "categories".',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      const product = {
        name: 'Test Product',
        description: 'Test Description',
        price: 10,
        categoryId: 'invalid-id',
        stock: 5,
      };

      await expect(addProduct(product)).rejects.toThrow(
        'Invalid category selected. The category may have been deleted or does not exist.'
      );
    });

    it('should handle unique constraint violation (duplicate SKU)', async () => {
      const mockError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "products_sku_key"',
        details: 'Key (sku)=(SKU123) already exists.',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      const product = {
        name: 'Test Product',
        description: 'Test Description',
        price: 10,
        categoryId: 'cat-1',
        stock: 5,
        sku: 'SKU123',
      };

      await expect(addProduct(product)).rejects.toThrow(
        'SKU already exists. Please use a unique SKU.'
      );
    });

    it('should handle unique constraint violation (duplicate barcode)', async () => {
      const mockError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "products_barcode_key"',
        details: 'Key (barcode)=(123456789) already exists.',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      const product = {
        name: 'Test Product',
        description: 'Test Description',
        price: 10,
        categoryId: 'cat-1',
        stock: 5,
        barcode: '123456789',
      };

      await expect(addProduct(product)).rejects.toThrow(
        'Barcode already exists. Please use a unique barcode.'
      );
    });

    it('should handle NOT NULL constraint violation', async () => {
      const mockError = {
        code: '23502',
        message: 'null value in column "name" violates not-null constraint',
        details: 'Failing row contains (id, null, ...).',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      const product = {
        name: '',
        description: 'Test Description',
        price: 10,
        categoryId: 'cat-1',
        stock: 5,
      };

      await expect(addProduct(product)).rejects.toThrow(
        "Required field 'Name' is missing."
      );
    });

    it('should handle generic errors with message', async () => {
      const mockError = {
        message: 'Connection timeout',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      const product = {
        name: 'Test Product',
        description: 'Test Description',
        price: 10,
        categoryId: 'cat-1',
        stock: 5,
      };

      await expect(addProduct(product)).rejects.toThrow('Connection timeout');
    });
  });

  describe('updateProduct', () => {
    it('should handle foreign key constraint violation on update', async () => {
      const mockError = {
        code: '23503',
        message: 'insert or update on table "products" violates foreign key constraint "products_category_id_fkey"',
        details: 'Key (category_id)=(invalid-id) is not present in table "categories".',
      };

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        description: 'Test Description',
        price: 10,
        categoryId: 'invalid-id',
        stock: 5,
      };

      await expect(updateProduct(product)).rejects.toThrow(
        'Invalid category selected. The category may have been deleted or does not exist.'
      );
    });

    it('should handle unique constraint violation on update', async () => {
      const mockError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "products_sku_key"',
        details: 'Key (sku)=(SKU123) already exists.',
      };

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        description: 'Test Description',
        price: 10,
        categoryId: 'cat-1',
        stock: 5,
        sku: 'SKU123',
      };

      await expect(updateProduct(product)).rejects.toThrow(
        'SKU already exists. Please use a unique SKU.'
      );
    });
  });

  describe('deleteProduct', () => {
    it('should handle foreign key constraint violation on delete', async () => {
      const mockError = {
        code: '23503',
        message: 'update or delete on table "products" violates foreign key constraint',
        details: 'Key is still referenced from another table.',
      };

      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      await expect(deleteProduct('prod-1')).rejects.toThrow(
        'Invalid reference: One of the selected values does not exist.'
      );
    });

    it('should handle generic errors on delete', async () => {
      const mockError = {
        message: 'Database connection lost',
      };

      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      await expect(deleteProduct('prod-1')).rejects.toThrow('Database connection lost');
    });
  });

  describe('Error message extraction', () => {
    it('should handle check constraint violation', async () => {
      const mockError = {
        code: '23514',
        message: 'new row for relation "products" violates check constraint "products_price_check"',
        details: 'Failing row contains (id, name, -10, ...).',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      const product = {
        name: 'Test Product',
        description: 'Test Description',
        price: -10,
        categoryId: 'cat-1',
        stock: 5,
      };

      await expect(addProduct(product)).rejects.toThrow(/Validation failed/);
    });

    it('should handle errors without specific code', async () => {
      const mockError = {
        message: 'Unknown database error',
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });

      (supabaseAdmin.from as any) = mockFrom;

      const product = {
        name: 'Test Product',
        description: 'Test Description',
        price: 10,
        categoryId: 'cat-1',
        stock: 5,
      };

      await expect(addProduct(product)).rejects.toThrow('Unknown database error');
    });
  });
});
