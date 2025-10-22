
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: string;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: 'Wave Money' | 'Cash on Delivery';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  couponCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Pages {
  [key: string]: PageContent;
}

export interface PageContent {
  title: string;
  content: string;
}

export interface User {
    uid: string;
    email: string;
    name: string;
    createdAt: string;
    role: 'admin' | 'customer';
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  helpful: number;
}

export interface Wishlist {
  id: string;
  userId: string;
  productIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductStats {
  averageRating: number;
  totalReviews: number;
  totalSales: number;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Order[];
  topProducts: Array<{ product: Product; sales: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  ordersByStatus: Record<Order['status'], number>;
}
