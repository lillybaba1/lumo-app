
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: string;
  // optional category id / slug for linking
  categoryId?: string;
  stock: number;
  // Advanced inventory fields
  sku?: string;
  barcode?: string;
  trackInventory?: boolean;
  reorderPoint?: number; // Min stock level before alert
  reorderQuantity?: number; // Qty to reorder when below reorder point
  stockByLocation?: Record<string, number>; // { locationId: quantity }
  weight?: number; // in kg
  dimensions?: { length: number; width: number; height: number }; // in cm
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

// Advanced Inventory Types
export interface WarehouseLocation {
  id: string;
  name: string;
  address?: string;
  type: 'warehouse' | 'store' | 'supplier' | 'other';
  isActive: boolean;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'damage';
  quantity: number; // Positive for increases, negative for decreases
  fromLocationId?: string;
  toLocationId?: string;
  orderId?: string; // If related to an order
  reason?: string;
  notes?: string;
  createdBy: string; // Admin user who made the transaction
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  currentStock: number;
  reorderPoint: number;
  locationId?: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'resolved' | 'ignored';
  createdAt: string;
  resolvedAt?: string;
}

// Email Template Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML content
  type: 'order_confirmation' | 'shipping_notification' | 'password_reset' | 'welcome' | 'custom';
  variables: string[]; // e.g., ['customerName', 'orderNumber', 'trackingNumber']
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Customer Segmentation Types
export interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  customerCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SegmentRule {
  field: 'totalSpent' | 'orderCount' | 'lastOrderDate' | 'tags' | 'customField';
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'notContains';
  value: string | number;
}

export interface CustomerTag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

// Marketing Campaign Types
export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms';
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  templateId?: string;
  subject?: string;
  content: string;
  segmentId?: string; // Target audience
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// Return/Exchange Types
export interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: ReturnItem[];
  reason: string;
  type: 'return' | 'exchange';
  status: 'pending' | 'approved' | 'rejected' | 'received' | 'refunded' | 'exchanged';
  refundAmount?: number;
  restockItems: boolean;
  notes?: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  condition?: 'new' | 'used' | 'damaged';
}
