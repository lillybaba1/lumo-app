export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  imageType: 'product' | 'foreground' | 'background';
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  displayOrder: number;
  isPrimary: boolean;
  altText?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  attributeName: string;
  attributeValue: string;
  attributeGroup?: string; // "Variant", "Specification", "Feature"
  displayOrder: number;
  isVariant: boolean;
  priceModifier?: number;
  stockModifier?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  variantName: string;
  sku?: string;
  priceModifier: number;
  stock: number;
  attributes: Record<string, string>; // e.g., { "Color": "Red", "Size": "XL" }
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sellerId: string; // FK to BusinessAccount - which seller owns this product
  imageUrls: string[]; // Legacy field - kept for backwards compatibility
  productImages?: string[]; // Legacy - Main product photos shown in carousel
  foregroundImages?: string[]; // Legacy - Foreground elements for admin/editing
  backgroundImages?: string[]; // Legacy - Background elements for admin/editing
  images?: ProductImage[]; // New structured images with crop data
  attributes?: ProductAttribute[]; // Product features/specifications
  variants?: ProductVariant[]; // Product variants
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
  description?: string;
  image?: string;
  icon?: string;
  bgColor?: string;
  textColor?: string;
  iconBgColor?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  sellerId?: string; // Denormalized from product.sellerId for easier querying
}

export interface OrderItem {
  product: Product;
  quantity: number;
  sellerId: string; // Which seller this item belongs to
  sellerStatus?: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'; // Seller-specific status
}

export interface Order {
  id: string;
  customerId?: string; // FK to User (optional for guest checkout)
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  items: OrderItem[]; // Changed from CartItem to OrderItem for better seller tracking
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
  updatedAt?: string;
}

// Role types for marketplace
export type UserRole = 'APP_OWNER_ADMIN' | 'BUSINESS_ACCOUNT' | 'PERSONAL_ACCOUNT';

// Business Account / Seller Entity
export interface BusinessAccount {
  id: string;
  ownerUserId: string; // FK to User with BUSINESS_ACCOUNT role
  businessName: string;
  contactPersonName: string;
  contactEmail: string;
  businessAddress: string;
  businessPhone?: string;
  taxId?: string; // Tax ID / Registration number
  website?: string;
  description?: string;
  logo?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'PENDING_APPROVAL';
  // Payout settings
  payoutMethod?: 'bank_transfer' | 'paypal' | 'stripe';
  payoutDetails?: Record<string, any>; // Bank account, PayPal email, etc.
  // Shipping settings
  shippingPolicies?: string;
  returnPolicy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
    uid: string;
    email: string;
    name: string;
    phoneNumber: string;
    emailVerified?: boolean;
    createdAt: string;
    role: UserRole;
    // Legacy support - map old 'admin' to APP_OWNER_ADMIN, 'customer' to PERSONAL_ACCOUNT
    businessAccountId?: string; // FK to BusinessAccount if role is BUSINESS_ACCOUNT
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

// FAQ Types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FAQData {
  title: string;
  introText?: string;
  faqs: FAQ[];
  updatedAt?: string;
}

// Contact Us Types
export interface ContactData {
  title: string;
  introText?: string;
  email?: string;
  phone?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  updatedAt?: string;
}

// Hero Product Types
export interface HeroProduct {
  id: string;
  productId: string;
  position: {
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
  };
  size: {
    width: number; // pixels
    height: number; // pixels
  };
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface HeroData {
  products: HeroProduct[];
  heroLabelText?: string;
  heroLabelPosition?: {
    x: number; // percentage
    y: number; // percentage
  };
  updatedAt?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'Wave Money' | 'Cash on Delivery';
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded';
  transactionId?: string;
  customerEmail: string;
  customerName: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}
