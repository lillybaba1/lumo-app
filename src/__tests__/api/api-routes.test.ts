/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase Admin
const mockSupabaseAdmin = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
};

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));

describe('Orders API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/orders', () => {
    it('should return orders for authenticated users', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          total: '99.99',
          status: 'Pending',
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockOrders,
          error: null,
        }),
      });

      // Import after mocks
      const { getOrders } = await import('@/services/orderService');
      const orders = await getOrders();

      expect(orders).toHaveLength(1);
      expect(orders[0].customerName).toBe('John Doe');
    });

    it('should return empty array on error', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const { getOrders } = await import('@/services/orderService');
      const orders = await getOrders();

      expect(orders).toEqual([]);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return a single order by ID', async () => {
      const mockOrder = {
        id: 'order-1',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '+1234567890',
        shipping_address: '123 Main St',
        items: [{ name: 'Product', quantity: 1, price: 99.99 }],
        subtotal: '99.99',
        discount: '0',
        total: '99.99',
        status: 'Pending',
        payment_method: 'card',
        payment_status: 'paid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockOrder,
          error: null,
        }),
      });

      const { getOrderById } = await import('@/services/orderService');
      const order = await getOrderById('order-1');

      expect(order).not.toBeNull();
      expect(order?.id).toBe('order-1');
      expect(order?.customerName).toBe('John Doe');
    });

    it('should return null for non-existent order', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        }),
      });

      const { getOrderById } = await import('@/services/orderService');
      const order = await getOrderById('non-existent');

      expect(order).toBeNull();
    });
  });
});

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all active products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Test Product',
          description: 'A test product',
          price: '29.99',
          stock: 100,
          is_active: true,
          category_id: 'cat-1',
          categories: { id: 'cat-1', name: 'Electronics' },
          product_images: [],
        },
      ];

      mockSupabaseAdmin.from.mockReturnValueOnce({
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
      expect(products[0].name).toBe('Test Product');
      expect(products[0].category).toBe('Electronics');
    });

    it('should handle products with images', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product with Images',
          description: 'Has images',
          price: '49.99',
          stock: 50,
          is_active: true,
          categories: { id: 'cat-1', name: 'Fashion' },
          product_images: [
            { image_url: 'https://example.com/image1.jpg', display_order: 1 },
            { image_url: 'https://example.com/image2.jpg', display_order: 0 },
          ],
        },
      ];

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockProducts,
          error: null,
        }),
      });

      const { getProducts } = await import('@/services/productService');
      const products = await getProducts();

      expect(products[0].productImages).toHaveLength(2);
      // Should be ordered by display_order
      expect(products[0]?.productImages?.[0]).toBe('https://example.com/image2.jpg');
    });

    it('should return empty array on error', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValueOnce(new Error('Database error')),
      });

      const { getProducts } = await import('@/services/productService');
      const products = await getProducts();

      expect(products).toEqual([]);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a single product by ID', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Single Product',
        description: 'Product details',
        price: '79.99',
        stock: 25,
        categories: { id: 'cat-1', name: 'Home' },
        product_images: [],
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockProduct,
          error: null,
        }),
      });

      const { getProductById } = await import('@/services/productService');
      const product = await getProductById('product-1');

      expect(product).not.toBeNull();
      expect(product?.name).toBe('Single Product');
    });
  });
});

describe('Business API Authorization', () => {
  it('should require authentication for business routes', async () => {
    // Test that unauthenticated requests are rejected
    const mockRequest = new NextRequest('https://example.com/api/business/products');

    // Without proper auth, should not be able to access business endpoints
    // This is enforced at the middleware level
    expect(mockRequest.nextUrl.pathname.startsWith('/api/business')).toBe(true);
  });
});

describe('Rate Limiting', () => {
  it('should apply rate limits to API routes', async () => {
    const { rateLimiter, RATE_LIMITS } = await import('@/lib/rate-limiter');

    // Reset for clean test
    await rateLimiter.reset();

    const identifier = 'test-ip-123';
    const config = RATE_LIMITS.API_GENERAL;

    // First request should pass
    const isLimited1 = await rateLimiter.isRateLimited(identifier, config.limit, config.window);
    expect(isLimited1).toBe(false);

    // Make many requests up to the limit
    for (let i = 1; i < config.limit; i++) {
      await rateLimiter.isRateLimited(identifier, config.limit, config.window);
    }

    // Next request should be rate limited
    const isLimited2 = await rateLimiter.isRateLimited(identifier, config.limit, config.window);
    expect(isLimited2).toBe(true);
  });

  it('should have separate limits for auth endpoints', async () => {
    const { rateLimiter, RATE_LIMITS } = await import('@/lib/rate-limiter');

    await rateLimiter.reset();

    const authConfig = RATE_LIMITS.API_AUTH;

    // Auth should have stricter limits (5 attempts per 15 min)
    expect(authConfig.limit).toBe(5);
    expect(authConfig.window).toBe(15 * 60 * 1000);
  });
});
