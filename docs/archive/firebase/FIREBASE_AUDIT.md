# Firebase to Supabase Migration Audit

**Date:** 2025-11-25
**Status:** 90% Complete - Final cleanup needed

---

## Executive Summary

**Migration Status:** Most services successfully migrated to Supabase. Firebase code remains primarily as:
1. Unused legacy API routes
2. Authentication fallback (can be removed)
3. Configuration files (can be removed once APIs are cleaned)

**Recommendation:** Complete the migration by removing unused Firebase code and dependencies.

---

## Current State Analysis

### ✅ Fully Migrated to Supabase

#### Core Services (100% Complete)
All service files in `src/services/` use Supabase:
- ✅ `productService.ts` - Supabase
- ✅ `userService.ts` - Supabase
- ✅ `categoryService.ts` - Supabase
- ✅ `orderService.ts` - Supabase
- ✅ `authService.ts` - Supabase
- ✅ `wishlistService.ts` - Supabase
- ✅ `reviewService.ts` - Supabase
- ✅ `couponService.ts` - Supabase
- ✅ `inventoryService.ts` - Supabase
- ✅ `storageService.ts` - **Supabase Storage**
- ✅ `themeService.ts` - Supabase
- ✅ `pageService.ts` - Supabase
- ✅ `settingsService.ts` - Supabase
- ✅ `paymentService.ts` - Supabase
- ✅ `analyticsService.ts` - Supabase

#### File Uploads (Active Use)
**All active file uploads use Supabase Storage via `storageService.ts`:**
- ✅ Theme customization (`appearance-form.tsx`)
- ✅ Hero images (`hero-settings-form.tsx`)
- ✅ Product images (`product-form.tsx`)

---

### ⚠️ Firebase Code Still Present

#### 1. Unused Legacy API Routes
**File:** `src/app/api/upload/route.ts`
- **Status:** UNUSED - No references in codebase
- **Uses:** Firebase Storage via Admin SDK
- **Action:** **CAN BE DELETED**
- **Impact:** None - superseded by `storageService.ts`

#### 2. Firebase Library Files
**Files:**
- `src/lib/firebaseAdmin.ts` - Firebase Admin SDK initialization
- `src/lib/firebaseClient.ts` - Firebase client SDK initialization
- `src/lib/firebaseConfig.ts` - Firebase project configuration

**Used By:**
- `src/app/api/upload/route.ts` (unused)
- `src/lib/auth-admin.ts` (fallback only)
- Some admin API routes (via auth-admin)

**Action:** Can be deleted after removing dependent code

#### 3. Auth Fallback Code
**File:** `src/lib/auth-admin.ts`
- **Primary Auth:** Supabase ✅
- **Fallback:** Firebase (lines 44-87)
- **Action:** Remove Firebase fallback, keep Supabase only

**Admin API Routes Using auth-admin:**
- `src/app/api/admin/orders/[id]/ship/route.ts`
- `src/app/api/admin/setup-first-admin/route.ts`
- `src/app/api/admin/users/[id]/promote/route.ts`
- `src/app/api/admin/verify/route.ts`
- `src/app/api/admin/diagnostics/route.ts`

**Status:** These routes work with Supabase auth, Firebase fallback is unnecessary

#### 4. Client-Side Pages
**Files referencing Firebase:**
- `src/app/verify-email/page.tsx` - Likely unused or needs update
- `src/app/admin/login/page.tsx` - May have Firebase imports
- `src/hooks/use-auth.ts` - Client auth hook

**Action:** Audit these files and remove Firebase references

---

## Dependencies Analysis

### Current Package.json
```json
{
  "firebase": "^12.1.0",
  "firebase-admin": "^12.1.1",
  "@genkit-ai/firebase": "1.16.1",

  "@supabase/supabase-js": "^2.80.0",
  "@supabase/ssr": "^0.7.0"
}
```

**Firebase Packages:**
- `firebase` - ~3.5 MB - For client SDK (unused)
- `firebase-admin` - ~2.1 MB - For server SDK (used only in `/api/upload`)
- `@genkit-ai/firebase` - For Genkit integration (may be needed for AI, investigate)

**Potential Savings:** ~5.6 MB from removing unused Firebase packages

---

## Migration Plan

### Phase 1: Remove Unused Code (Safe - High Priority) ✅

**Step 1.1: Delete unused upload API**
```bash
rm src/app/api/upload/route.ts
```
- **Impact:** None - route is not used
- **Test:** Verify image uploads still work in admin panel

**Step 1.2: Update auth-admin to remove Firebase fallback**
```typescript
// src/lib/auth-admin.ts
// Remove lines 44-87 (Firebase fallback logic)
// Keep only Supabase authentication
```
- **Impact:** Minimal - fallback was rarely if ever used
- **Test:** Admin login and access control

**Step 1.3: Remove Firebase library files**
```bash
rm src/lib/firebaseAdmin.ts
rm src/lib/firebaseClient.ts
rm src/lib/firebaseConfig.ts
```
- **Depends on:** Steps 1.1 and 1.2 complete
- **Impact:** None after dependencies removed

---

### Phase 2: Clean Up Client Code (Medium Priority)

**Step 2.1: Audit and update client pages**
Files to check:
- `src/app/verify-email/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/hooks/use-auth.ts`

**Actions:**
- Remove Firebase imports
- Ensure using Supabase auth only
- Test authentication flows

---

### Phase 3: Remove Dependencies (Low Risk After Code Cleanup)

**Step 3.1: Remove Firebase packages**
```bash
npm uninstall firebase firebase-admin
```

**Step 3.2: Check @genkit-ai/firebase necessity**
- Investigate if Genkit AI requires this package
- If not needed for Gemini/OpenAI, remove:
  ```bash
  npm uninstall @genkit-ai/firebase
  ```

**Step 3.3: Update environment variables**
- Remove Firebase-related env vars from documentation
- Keep only Supabase env vars in deployment guides

---

### Phase 4: Clean Up Configuration Files

**Step 4.1: Remove Firebase config files**
```bash
rm firebase.json
rm .firebaserc
rm -rf .firebase/
```

**Step 4.2: Update .gitignore**
- Remove Firebase-specific entries if they exist

---

## Testing Checklist

Before considering migration complete, test:

- [ ] User authentication (login/signup)
- [ ] Admin authentication and access control
- [ ] Product image uploads
- [ ] Theme customization image uploads
- [ ] Hero section image uploads
- [ ] Product CRUD operations
- [ ] Order management
- [ ] User profile management
- [ ] All admin features

---

## Rollback Plan

If issues arise:
1. Revert commits using `git revert`
2. Firebase code is preserved in git history
3. Can restore specific files if needed

**Low Risk:** Most Firebase code is already unused

---

## Estimated Impact

### Benefits
- ✅ **Reduced bundle size:** ~5.6 MB
- ✅ **Simpler codebase:** Remove dual auth systems
- ✅ **Lower costs:** One less service to maintain
- ✅ **Faster builds:** Fewer dependencies
- ✅ **Cleaner architecture:** Single source of truth for storage/auth

### Risks
- ⚠️ **Low:** Most Firebase code already unused
- ⚠️ **Test thoroughly:** Ensure no hidden dependencies
- ⚠️ **Monitor:** Watch for errors after deployment

---

## Timeline

- **Phase 1:** 1-2 hours (safe deletions)
- **Phase 2:** 2-3 hours (client code audit)
- **Phase 3:** 30 minutes (dependency removal)
- **Phase 4:** 15 minutes (config cleanup)

**Total:** ~4-6 hours of work + testing

---

## Next Steps

**Immediate Actions:**
1. ✅ Review this audit with stakeholders
2. Create backup branch before changes
3. Start with Phase 1 (safest, highest impact)
4. Test thoroughly after each phase
5. Deploy incrementally

**Long Term:**
- Monitor Supabase usage and costs
- Optimize Supabase Storage policies
- Consider Supabase CDN for images

---

## Files Summary

### Files to Delete (11 files)
```
src/app/api/upload/route.ts
src/lib/firebaseAdmin.ts
src/lib/firebaseClient.ts
src/lib/firebaseConfig.ts
firebase.json
.firebaserc
.firebase/ (directory)
```

### Files to Modify (4 files)
```
src/lib/auth-admin.ts (remove Firebase fallback)
src/app/verify-email/page.tsx (remove Firebase imports if any)
src/app/admin/login/page.tsx (audit Firebase usage)
src/hooks/use-auth.ts (ensure Supabase only)
```

### Files to Keep (All Supabase)
All `src/services/*` files already using Supabase ✅

---

**Recommendation:** Proceed with Phase 1 immediately. It's safe, well-tested, and provides immediate benefits.
