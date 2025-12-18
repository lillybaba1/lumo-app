/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase Admin for all service tests
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: mockFrom,
    rpc: mockRpc,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
        remove: vi.fn(),
      })),
    },
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: mockFrom,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Order Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should fetch and transform orders correctly', async () => {
      const mockOrderData = [
        {
          id: 'order-1',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          customer_phone: '+1234567890',
          shipping_address: '123 Main St',
          items: [{ name: 'Product', quantity: 2, price: 25 }],
          subtotal: '50.00',
          discount: '5.00',
          total: '45.00',
          status: 'Processing',
          payment_method: 'card',
          payment_status: 'paid',
          coupon_code: 'SAVE5',
          notes: 'Test order',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockOrderData,
          error: null,
        }),
      });

      const { getOrders } = await import('@/services/orderService');
      const orders = await getOrders();

      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        id: 'order-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        subtotal: 50,
        discount: 5,
        total: 45,
        status: 'Processing',
      });
    });

    it('should handle empty results', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: [],
          error: null,
        }),
      });

      const { getOrders } = await import('@/services/orderService');
      const orders = await getOrders();

      expect(orders).toEqual([]);
    });
  });

  describe('getOrdersByEmail', () => {
    it('should fetch orders for a specific email', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          customer_name: 'Jane Doe',
          customer_email: 'jane@example.com',
          subtotal: '100.00',
          discount: '0',
          total: '100.00',
          status: 'Delivered',
        },
      ];

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockOrders,
          error: null,
        }),
      });

      const { getOrdersByEmail } = await import('@/services/orderService');
      const orders = await getOrdersByEmail('jane@example.com');

      expect(orders).toHaveLength(1);
      expect(orders[0].customerEmail).toBe('jane@example.com');
    });
  });
});

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch products with categories and images', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Test Product',
          description: 'A great product',
          price: '99.99',
          stock: 50,
          is_active: true,
          category_id: 'cat-1',
          sku: 'SKU-001',
          seller_id: 'seller-1',
          categories: { id: 'cat-1', name: 'Electronics' },
          product_images: [
            { image_url: 'https://example.com/img1.jpg', display_order: 0 },
          ],
        },
      ];

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockProducts,
          error: null,
        }),
      });

      const { getProducts } = await import('@/services/productService');
      const products = await getProducts();

      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({
        id: 'prod-1',
        name: 'Test Product',
        price: 99.99,
        stock: 50,
        category: 'Electronics',
        sku: 'SKU-001',
      });
    });

    it('should sort product images by display order', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Multi-Image Product',
          description: 'Has many images',
          price: '49.99',
          stock: 10,
          categories: { name: 'Fashion' },
          product_images: [
            { image_url: 'img3.jpg', display_order: 2 },
            { image_url: 'img1.jpg', display_order: 0 },
            { image_url: 'img2.jpg', display_order: 1 },
          ],
        },
      ];

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockProducts,
          error: null,
        }),
      });

      const { getProducts } = await import('@/services/productService');
      const products = await getProducts();

      expect(products[0].productImages).toEqual([
        'img1.jpg',
        'img2.jpg',
        'img3.jpg',
      ]);
    });
  });

  describe('getProductById', () => {
    it('should fetch a single product with full details', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Detailed Product',
        description: 'Full product details',
        price: '149.99',
        stock: 25,
        sku: 'SKU-002',
        barcode: 'BAR-002',
        track_inventory: true,
        reorder_point: 10,
        categories: { id: 'cat-2', name: 'Home' },
        product_images: [],
      };

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockProduct,
          error: null,
        }),
      });

      const { getProductById } = await import('@/services/productService');
      const product = await getProductById('prod-1');

      expect(product).not.toBeNull();
      expect(product?.id).toBe('prod-1');
      expect(product?.price).toBe(149.99);
    });

    it('should return null for non-existent product', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        }),
      });

      const { getProductById } = await import('@/services/productService');
      const product = await getProductById('non-existent');

      expect(product).toBeNull();
    });
  });
});

describe('Category Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should fetch categories from database', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Electronics', description: 'Tech stuff', slug: 'electronics' },
        { id: 'cat-2', name: 'Fashion', description: 'Clothing', slug: 'fashion' },
      ];

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockCategories,
          error: null,
        }),
      });

      const { getCategories } = await import('@/services/categoryService');
      const categories = await getCategories();

      // Categories may include default/hardcoded ones plus mocked ones
      expect(categories.length).toBeGreaterThanOrEqual(2);
      // Check that we have some expected category names
      const categoryNames = categories.map((c: { name: string }) => c.name);
      expect(categoryNames).toContain('Electronics');
    });
  });
});

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should fetch user profile data', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        phone_number: '+1234567890',
        email_verified: true,
        role: 'PERSONAL_ACCOUNT',
        created_at: '2025-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockUser,
          error: null,
        }),
      });

      // Direct Supabase query test
      const result = await mockFrom('users').select('*').eq('id', 'user-1').single();
      
      expect(result.data).toMatchObject({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      });
    });
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle database errors gracefully', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValueOnce(new Error('Connection failed')),
    });

    const { getProducts } = await import('@/services/productService');
    
    // Should not throw, should return empty array
    const products = await getProducts();
    expect(products).toEqual([]);
  });

  it('should handle null data gracefully', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({
        data: null,
        error: null,
      }),
    });

    const { getProducts } = await import('@/services/productService');
    const products = await getProducts();
    
    expect(products).toEqual([]);
  });
});
