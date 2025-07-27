import type { Product, Category, Order } from './types';

export const categories: Category[] = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'food', name: 'Food' },
];

export const products: Product[] = [
  { id: '1', name: 'Wireless Headphones', description: 'High-fidelity sound', price: 199.99, imageUrl: 'https://placehold.co/600x600', category: 'Electronics', stock: 15 },
  { id: '2', name: 'Organic Green Tea', description: 'Fresh and aromatic', price: 12.50, imageUrl: 'https://placehold.co/600x600', category: 'Food', stock: 50 },
  { id: '3', name: 'Silk Scarf', description: '100% pure silk', price: 75.00, imageUrl: 'https://placehold.co/600x600', category: 'Fashion', stock: 25 },
  { id: '4', name: 'Vitamin C Serum', description: 'Brightens and evens skin tone', price: 45.00, imageUrl: 'https://placehold.co/600x600', category: 'Beauty', stock: 40 },
  { id: '5', name: 'Smartwatch', description: 'Track your fitness and notifications', price: 249.99, imageUrl: 'https://placehold.co/600x600', category: 'Electronics', stock: 20 },
  { id: '6', name: 'Artisanal Chocolate Bar', description: '70% dark chocolate with sea salt', price: 8.99, imageUrl: 'https://placehold.co/600x600', category: 'Food', stock: 100 },
  { id: '7', name: 'Leather Handbag', description: 'Genuine leather with gold hardware', price: 320.00, imageUrl: 'https://placehold.co/600x600', category: 'Fashion', stock: 10 },
  { id: '8', name: 'Hydrating Face Mask', description: 'For a glowing complexion', price: 22.00, imageUrl: 'https://placehold.co/600x600', category: 'Beauty', stock: 60 },
];

export const orders: Order[] = [
  { id: 'ORD-001', customerName: 'John Doe', total: 274.99, status: 'Delivered', date: '2023-10-25', paymentMethod: 'Wave Money', items: [ { product: products[0], quantity: 1 }, { product: products[3], quantity: 1} ] },
  { id: 'ORD-002', customerName: 'Jane Smith', total: 83.99, status: 'Shipped', date: '2023-10-26', paymentMethod: 'Cash on Delivery', items: [ { product: products[2], quantity: 1 }, { product: products[5], quantity: 1} ] },
  { id: 'ORD-003', customerName: 'Emily Jones', total: 45.00, status: 'Pending', date: '2023-10-27', paymentMethod: 'Wave Money', items: [ { product: products[3], quantity: 1 } ]},
  { id: 'ORD-004', customerName: 'Michael Brown', total: 249.99, status: 'Pending', date: '2023-10-28', paymentMethod: 'Cash on Delivery', items: [ { product: products[4], quantity: 1 } ]},
  { id: 'ORD-005', customerName: 'Sarah Wilson', total: 342.00, status: 'Delivered', date: '2023-10-22', paymentMethod: 'Wave Money', items: [ { product: products[6], quantity: 1 }, { product: products[7], quantity: 1 } ]},
];
