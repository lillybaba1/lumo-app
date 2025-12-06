-- Cleanup Script for Seller Features
-- Run this FIRST if you want to start fresh with migrations 010-017
-- WARNING: This will DELETE all data in these tables!

-- Drop functions first
DROP FUNCTION IF EXISTS update_seller_rating_summary() CASCADE;
DROP FUNCTION IF EXISTS check_low_stock() CASCADE;
DROP FUNCTION IF EXISTS update_seller_balance() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;

-- Drop tables in reverse dependency order

-- 017 - Shipping & Fulfillment
DROP TABLE IF EXISTS boutique_shipping_settings CASCADE;
DROP TABLE IF EXISTS boutique_shipments CASCADE;
DROP TABLE IF EXISTS boutique_shipping_labels CASCADE;
DROP TABLE IF EXISTS boutique_pickup_locations CASCADE;
DROP TABLE IF EXISTS boutique_shipping_rates CASCADE;
DROP TABLE IF EXISTS boutique_shipping_zones CASCADE;

-- 016 - Marketing Tools
DROP TABLE IF EXISTS boutique_automations CASCADE;
DROP TABLE IF EXISTS boutique_social_sharing CASCADE;
DROP TABLE IF EXISTS boutique_referral_conversions CASCADE;
DROP TABLE IF EXISTS boutique_referral_codes CASCADE;
DROP TABLE IF EXISTS boutique_referral_programs CASCADE;
DROP TABLE IF EXISTS boutique_campaigns CASCADE;
DROP TABLE IF EXISTS boutique_subscribers CASCADE;

-- 015 - Boutique Customization
DROP TABLE IF EXISTS boutique_announcements CASCADE;
DROP TABLE IF EXISTS boutique_social_links CASCADE;
DROP TABLE IF EXISTS boutique_about CASCADE;
DROP TABLE IF EXISTS boutique_sections CASCADE;
DROP TABLE IF EXISTS boutique_banners CASCADE;
DROP TABLE IF EXISTS boutique_themes CASCADE;

-- 014 - Payout Management
DROP TABLE IF EXISTS seller_balances CASCADE;
DROP TABLE IF EXISTS commission_tiers CASCADE;
DROP TABLE IF EXISTS seller_payout_settings CASCADE;
DROP TABLE IF EXISTS seller_earnings CASCADE;
DROP TABLE IF EXISTS seller_payouts CASCADE;
DROP TABLE IF EXISTS seller_payout_accounts CASCADE;

-- 013 - Seller Reviews
DROP TABLE IF EXISTS seller_rating_summary CASCADE;
DROP TABLE IF EXISTS seller_badge_assignments CASCADE;
DROP TABLE IF EXISTS seller_badges CASCADE;
DROP TABLE IF EXISTS review_helpful_votes CASCADE;
DROP TABLE IF EXISTS seller_review_responses CASCADE;
DROP TABLE IF EXISTS seller_reviews CASCADE;

-- 012 - Advanced Products
DROP TABLE IF EXISTS product_tag_assignments CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS product_preorders CASCADE;
DROP TABLE IF EXISTS inventory_alerts CASCADE;
DROP TABLE IF EXISTS product_options CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;

-- 011 - Messaging System
DROP TABLE IF EXISTS seller_notification_settings CASCADE;
DROP TABLE IF EXISTS seller_quick_replies CASCADE;
DROP TABLE IF EXISTS seller_messages CASCADE;
DROP TABLE IF EXISTS seller_conversations CASCADE;

-- 010 - Seller Promotions
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS bundle_deals CASCADE;
DROP TABLE IF EXISTS flash_sales CASCADE;
DROP TABLE IF EXISTS seller_coupons CASCADE;

-- Confirm cleanup
SELECT 'Cleanup complete! You can now run migrations 010-017.' as status;
