# JulaZone Improvements — Week 1 Priority Fixes

## Security & SEO Foundations

### 1. Fix search parameter injection in productService.ts
- **File:** `src/services/productService.ts:71`
- **Issue:** User search input passed unsanitized into PostgREST `.or()` filter — allows query manipulation
- **Fix:** Escape PostgREST special characters (`%`, `_`, `(`, `)`, `,`) in search input before interpolation
- [x] Done

### 2. Consolidate admin role check to single table
- **Files:** `src/lib/auth-admin.ts:51`, `src/app/api/auth/me/route.ts:24`
- **Issue:** Admin role checked in BOTH `users` AND `user_profiles` tables — either grants admin. Attacker who can write to `user_profiles` gains admin access
- **Fix:** Use only `users` table as the single source of truth for roles
- [x] Done

### 3. Add sitemap.ts
- **Issue:** No XML sitemap — Google can't discover products, boutiques, or categories
- **Fix:** Create `src/app/sitemap.ts` that dynamically generates entries for all public pages, products, boutiques
- [x] Done

### 4. Add robots.ts
- **Issue:** No robots.txt — admin, business, and API routes could be indexed by search engines
- **Fix:** Create `src/app/robots.ts` that allows public pages and blocks admin/business/API routes
- [x] Done

### 5. Fix all $ → D currency hardcoding
- **Files:** `src/app/page.tsx` (lines 726, 737-738), `src/app/products/page.tsx` (lines 262, 271-272), `src/app/products/[id]/page.tsx` (lines 73, 224), `src/lib/currency.ts` (line 7)
- **Issue:** Dollar sign `$` hardcoded throughout price filter UIs and fallback values instead of Dalasi `D`
- **Fix:** Replace all hardcoded `$` with dynamic `currencySymbol` from settings context, change default fallback to `D`
- [x] Done

### 6. Add authorization to critical service functions
- **Files:** `src/services/orderService.ts`, `src/services/productService.ts`, `src/services/paymentService.ts`
- **Issue:** `createOrder`, `updateOrder`, `deleteProduct`, `createPayment` all use `supabaseAdmin` with zero caller verification
- **Fix:** Add auth checks to order update/delete and product update/delete functions
- [x] Done

### 7. Fix upload folder path traversal
- **File:** `src/app/api/upload/route.ts:33`
- **Issue:** `folder` form parameter not sanitized — allows placing files in arbitrary storage paths
- **Fix:** Sanitize `folder` param (strip `..`, `/`, `\`) and validate against allowed folder list
- [x] Done

## Performance & Core UX

### 8. Centralize settings + auth (stop duplicate fetches)
- **Files:** `src/components/header.tsx`, `src/components/footer.tsx`, `src/components/bottom-navigation.tsx`
- **Issue:** Header, Footer, and BottomNav each independently fetch `/api/auth/me` + `/api/settings` — 4-6 duplicate calls per page load
- **Fix:** Use the existing `SettingsContext` in all components instead of independent fetches; add auth data to context
- [x] Done

### 9. Add rate limiting to public API routes
- **Files:** `src/app/api/products/route.ts`, `src/app/api/orders/route.ts`, `src/app/api/upload/route.ts`, `src/app/api/auth/me/route.ts`, `src/app/api/boutiques/search/route.ts`
- **Issue:** These public/authenticated endpoints have zero rate limiting — allows scraping, DDoS, storage flooding
- **Fix:** Apply existing `RateLimiter` from `src/lib/rate-limiter.ts` to each route
- [x] Done

### 10. Add JSON-LD structured data to product pages
- **File:** `src/app/products/[id]/page.tsx`
- **Issue:** No structured data — no rich snippets (price, rating, availability) in Google search results
- **Fix:** Add `<script type="application/ld+json">` with Product schema on product detail pages
- [x] Done

### 11. Pre-fill checkout form for logged-in users
- **File:** `src/app/checkout/page.tsx`
- **Issue:** Checkout always asks for name/email/phone even if user is logged in — unnecessary friction
- **Fix:** Fetch user profile on mount and pre-fill form fields
- [x] Done

### 12. Add per-page metadata to remaining routes
- **Files:** `src/app/page.tsx`, `src/app/products/page.tsx`, `src/app/cart/page.tsx`, `src/app/search/page.tsx`, `src/app/boutiques/page.tsx`, `src/app/categories/page.tsx`
- **Issue:** Only product detail + boutique pages define `generateMetadata`. All other pages use the generic root "Your modern e-commerce experience" title
- **Fix:** Add proper `metadata` exports with relevant titles and descriptions to each page
- [x] Done

### 13. Fix rate limiter fail-open behavior
- **File:** `src/lib/rate-limiter.ts:156`
- **Issue:** Redis errors return `false` (not rate-limited), allowing all requests through when Redis is down
- **Fix:** Change to fail-closed — return `true` (rate-limited) on Redis errors, with a short circuit breaker
- [x] Done

### 14. Sanitize folder param and fix upload admin check
- **File:** `src/app/api/upload/route.ts`
- **Issue:** Admin check queries `profiles` table (wrong table); SVG uploads allow XSS; folder param allows traversal
- **Fix:** Fix admin table check, remove SVG from allowed types, sanitize folder parameter
- [x] Done

---

## Progress Tracker
- Total: 14 items
- Completed: 14/14
- Status: 🟢 All done
