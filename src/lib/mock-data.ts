 import type { Product, Category, Order } from './types';

export const categories: Category[] = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'food', name: 'Food' },
];

export const products: Product[] = [
  { id: '1', name: 'Wireless Headphones', description: 'High-fidelity sound', price: 199.99, imageUrls: ['https://picsum.photos/seed/headphones1/600/600', 'https://picsum.photos/seed/headphones2/600/600', 'https://picsum.photos/seed/headphones3/600/600'], category: 'Electronics', categoryId: 'electronics', stock: 15, sellerId: 'mock-seller-id' },
  { id: '2', name: 'Organic Green Tea', description: 'Fresh and aromatic', price: 12.50, imageUrls: ['https://picsum.photos/seed/tea/600/600'], category: 'Food', categoryId: 'food', stock: 50, sellerId: 'mock-seller-id' },
  { id: '3', name: 'Silk Scarf', description: '100% pure silk', price: 75.00, imageUrls: ['https://picsum.photos/seed/scarf/600/600'], category: 'Fashion', categoryId: 'fashion', stock: 25, sellerId: 'mock-seller-id' },
  { id: '4', name: 'Vitamin C Serum', description: 'Brightens and evens skin tone', price: 45.00, imageUrls: ['https://picsum.photos/seed/serum/600/600'], category: 'Beauty', categoryId: 'beauty', stock: 40, sellerId: 'mock-seller-id' },
  { id: '5', name: 'Smartwatch', description: 'Track your fitness and notifications', price: 249.99, imageUrls: ['https://picsum.photos/seed/smartwatch/600/600'], category: 'Electronics', categoryId: 'electronics', stock: 20, sellerId: 'mock-seller-id' },
  { id: '6', name: 'Artisanal Chocolate Bar', description: '70% dark chocolate with sea salt', price: 8.99, imageUrls: ['https://picsum.photos/seed/chocolate/600/600'], category: 'Food', categoryId: 'food', stock: 100, sellerId: 'mock-seller-id' },
  { id: '7', name: 'Leather Handbag', description: 'Genuine leather with gold hardware', price: 320.00, imageUrls: ['https://picsum.photos/seed/handbag/600/600'], category: 'Fashion', categoryId: 'fashion', stock: 10, sellerId: 'mock-seller-id' },
  { id: '8', name: 'Hydrating Face Mask', description: 'For a glowing complexion', price: 22.00, imageUrls: ['https://picsum.photos/seed/mask/600/600'], category: 'Beauty', categoryId: 'beauty', stock: 60, sellerId: 'mock-seller-id' },
];

export const orders: Order[] = [
  { id: 'ORD-001', customerName: 'John Doe', customerEmail: 'john@example.com', shippingAddress: '123 Main St', subtotal: 274.99, discount: 0, total: 274.99, status: 'Delivered', paymentStatus: 'Paid', createdAt: '2023-10-25', paymentMethod: 'Wave Money', items: [ { product: products[0], quantity: 1, sellerId: 'mock-seller-id' }, { product: products[3], quantity: 1, sellerId: 'mock-seller-id'} ] },
  { id: 'ORD-002', customerName: 'Jane Smith', customerEmail: 'jane@example.com', shippingAddress: '456 Oak Ave', subtotal: 83.99, discount: 0, total: 83.99, status: 'Shipped', paymentStatus: 'Paid', createdAt: '2023-10-26', paymentMethod: 'Cash on Delivery', items: [ { product: products[2], quantity: 1, sellerId: 'mock-seller-id' }, { product: products[5], quantity: 1, sellerId: 'mock-seller-id'} ] },
  { id: 'ORD-003', customerName: 'Emily Jones', customerEmail: 'emily@example.com', shippingAddress: '789 Pine Ln', subtotal: 45.00, discount: 0, total: 45.00, status: 'Pending', paymentStatus: 'Pending', createdAt: '2023-10-27', paymentMethod: 'Wave Money', items: [ { product: products[3], quantity: 1, sellerId: 'mock-seller-id' } ]},
  { id: 'ORD-004', customerName: 'Michael Brown', customerEmail: 'michael@example.com', shippingAddress: '321 Elm St', subtotal: 249.99, discount: 0, total: 249.99, status: 'Pending', paymentStatus: 'Pending', createdAt: '2023-10-28', paymentMethod: 'Cash on Delivery', items: [ { product: products[4], quantity: 1, sellerId: 'mock-seller-id' } ]},
  { id: 'ORD-005', customerName: 'Sarah Wilson', customerEmail: 'sarah@example.com', shippingAddress: '654 Maple Dr', subtotal: 342.00, discount: 0, total: 342.00, status: 'Delivered', paymentStatus: 'Paid', createdAt: '2023-10-22', paymentMethod: 'Wave Money', items: [ { product: products[6], quantity: 1, sellerId: 'mock-seller-id' }, { product: products[7], quantity: 1, sellerId: 'mock-seller-id' } ]},
];
