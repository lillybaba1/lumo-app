/**
 * Database Row Types
 * These types represent the raw data structure from Supabase tables
 * Use these instead of 'any' when working with database results
 */

// =============================================================================
// Users & Auth
// =============================================================================

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  phone_number: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  role: 'customer' | 'admin' | 'APP_OWNER_ADMIN' | 'BUSINESS_ACCOUNT' | 'PERSONAL_ACCOUNT';
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DbUserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

// =============================================================================
// Business Accounts & Boutiques
// =============================================================================

export interface DbBusinessAccount {
  id: string;
  owner_user_id: string;
  business_name: string;
  business_type: string | null;
  contact_email: string;
  contact_phone: string | null;
  contact_person_name: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_country: string | null;
  business_postal_code: string | null;
  tax_id: string | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  account_approved: boolean;
  boutique_submitted: boolean;
  boutique_approved: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_documents: string[] | null;
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string | null;
}

export interface DbBoutique {
  id: string;
  business_account_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  theme_color: string | null;
  accent_color: string | null;
  is_active: boolean;
  is_featured: boolean;
  follower_count: number;
  rating: number | null;
  total_reviews: number;
  created_at: string;
  updated_at: string | null;
  // Social links
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
}

// =============================================================================
// Products & Categories
// =============================================================================

export interface DbProduct {
  id: string;
  seller_id: string | null;
  name: string;
  description: string | null;
  price: string; // Stored as decimal string
  compare_at_price: string | null;
  cost_per_item: string | null;
  category_id: string | null;
  sku: string | null;
  barcode: string | null;
  track_inventory: boolean;
  stock: number;
  reorder_point: number | null;
  reorder_quantity: number | null;
  stock_by_location: Record<string, number> | null;
  weight: string | null;
  dimensions: { length?: number; width?: number; height?: number } | null;
  image_urls: string[] | null;
  foreground_images: string[] | null;
  background_images: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DbProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_type: 'main' | 'gallery' | 'foreground' | 'background';
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  crop_x: number | null;
  crop_y: number | null;
  crop_width: number | null;
  crop_height: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  bg_color: string | null;
  text_color: string | null;
  icon_bg_color: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

// =============================================================================
// Orders & Payments
// =============================================================================

export interface DbOrder {
  id: string;
  user_id: string;
  seller_id: string | null;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string | null;
  subtotal: string;
  tax: string;
  shipping_cost: string;
  discount: string;
  total: string;
  currency: string;
  shipping_address: DbShippingAddress | null;
  billing_address: DbShippingAddress | null;
  notes: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: string;
  total_price: string;
  variant_options: Record<string, string> | null;
  created_at: string;
}

export interface DbShippingAddress {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface DbPayment {
  id: string;
  order_id: string;
  user_id: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  payment_provider: string | null;
  provider_transaction_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

// =============================================================================
// Reviews & Ratings
// =============================================================================

export interface DbReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string | null;
  helpful: number;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string | null;
}

// =============================================================================
// Visitors & Analytics
// =============================================================================

export interface DbVisitor {
  id: string;
  visitor_id: string;
  ip_address: string | null;
  country: string | null;
  country_code: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isp: string | null;
  user_agent: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string | null;
  os: string | null;
  referrer: string | null;
  landing_page: string;
  page_views: number;
  session_duration: number;
  last_activity: string;
  is_returning: boolean;
  consent_given: boolean;
  created_at: string;
}

export interface DbPageView {
  id: string;
  visitor_id: string;
  page_path: string;
  page_title: string | null;
  referrer: string | null;
  time_on_page: number | null;
  created_at: string;
}

// =============================================================================
// Settings & Configuration
// =============================================================================

export interface DbSiteSetting {
  id: string;
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string | null;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DbPlatformSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
}

// =============================================================================
// Notifications
// =============================================================================

export interface DbAdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  business_account_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// =============================================================================
// Wishlists
// =============================================================================

export interface DbWishlist {
  id: string;
  user_id: string;
  product_ids: string[];
  created_at: string;
  updated_at: string | null;
}

// =============================================================================
// Helper Types for Joins
// =============================================================================

export interface DbProductWithCategory extends DbProduct {
  categories: DbCategory | null;
}

export interface DbProductWithImages extends DbProduct {
  product_images: DbProductImage[];
}

export interface DbProductWithSeller extends DbProduct {
  business_accounts: Pick<DbBusinessAccount, 'id' | 'business_name' | 'contact_person_name' | 'verification_status'> | null;
}

export interface DbOrderWithItems extends DbOrder {
  order_items: DbOrderItem[];
}

export interface DbBoutiqueWithBusinessAccount extends DbBoutique {
  business_accounts: DbBusinessAccount;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isDbProduct(obj: unknown): obj is DbProduct {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'price' in obj
  );
}

export function isDbOrder(obj: unknown): obj is DbOrder {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'order_number' in obj &&
    'status' in obj
  );
}

export function isDbBusinessAccount(obj: unknown): obj is DbBusinessAccount {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'business_name' in obj &&
    'owner_user_id' in obj
  );
}
