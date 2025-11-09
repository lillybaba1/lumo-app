# Firebase Phone Authentication Setup Guide

This guide covers setting up phone authentication for development and production environments.

## Table of Contents

1. [Enable Phone Authentication](#enable-phone-authentication)
2. [Setup Test Phone Numbers](#setup-test-phone-numbers)
3. [Configure Authorized Domains](#configure-authorized-domains)
4. [Development Best Practices](#development-best-practices)
5. [Production Considerations](#production-considerations)
6. [Troubleshooting](#troubleshooting)

## Enable Phone Authentication

### Step 1: Access Firebase Console

1. Go to: https://console.firebase.google.com/project/lumo-app-183f5/authentication/providers
2. Log in with your Firebase account

### Step 2: Enable Phone Provider

1. Scroll to **"Phone"** in the Sign-in providers list
2. Click on **Phone**
3. Toggle the **Enable** switch to ON
4. Click **Save**

### Step 3: Verify Settings

Once enabled, you should see:
- ✅ Phone provider is enabled
- ✅ Test phone numbers section (for adding test numbers)
- ✅ Quota information

## Setup Test Phone Numbers

**Why use test numbers?**
- Avoid SMS quota limits during development
- Prevent triggering `auth/too-many-requests` errors
- No real SMS sent (saves costs)
- Fixed verification codes for predictable testing

### Adding Test Phone Numbers

1. In Firebase Console → Authentication → Sign-in method → Phone
2. Scroll to **"Phone numbers for testing"**
3. Click **"Add phone number"**

### Recommended Test Numbers

Add these test phone numbers with their verification codes:

| Phone Number | Verification Code | Use Case |
|--------------|-------------------|----------|
| +15555550100 | 123456 | General development |
| +15555550101 | 654321 | Admin user testing |
| +15555550102 | 111111 | Customer signup testing |
| +15555550103 | 222222 | Error scenario testing |

**Format:**
- Phone Number: `+15555550100`
- Verification Code: `123456`

### Using Test Numbers in Development

When developing:

```typescript
// Example signup with test number
const phoneNumber = "+15555550100"; // Test number
// User receives no SMS
// Always use code: 123456
```

**Important:**
- Test numbers don't receive real SMS
- Always use the configured verification code
- Test numbers bypass quota limits
- Can't use test numbers in production builds

## Configure Authorized Domains

Firebase only allows phone auth from authorized domains.

### Step 1: Access Authorized Domains

1. Go to: https://console.firebase.google.com/project/lumo-app-183f5/authentication/settings
2. Click on **"Authorized domains"** tab

### Step 2: Add Your Domains

Ensure these domains are added:

**Development:**
- `localhost`
- `127.0.0.1`

**Production:**
- `lumo-app.org` (your custom domain)
- `www.lumo-app.org` (if using www subdomain)
- `lumo-app-183f5.web.app` (Firebase hosting domain)
- `lumo-app-183f5.firebaseapp.com` (Firebase app domain)

**Note:** Firebase automatically adds its own domains. You need to manually add custom domains.

### Step 3: Add Custom Domain

1. Click **"Add domain"**
2. Enter your domain (e.g., `lumo-app.org`)
3. Click **Add**
4. Wait for verification (may take a few minutes)

## Development Best Practices

### 1. Use RecaptchaVerifier as Singleton

**❌ BAD:**
```typescript
// Creates new verifier on every render
useEffect(() => {
  const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
}, []); // Recreated if component remounts
```

**✅ GOOD:**
```typescript
// Singleton pattern with useRef
const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

const getRecaptchaVerifier = () => {
  if (!recaptchaVerifierRef.current) {
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
  }
  return recaptchaVerifierRef.current;
};
```

### 2. Call sendVerificationCode Only on User Action

**❌ BAD:**
```typescript
// Auto-sends on page load
useEffect(() => {
  sendVerificationCode(phoneNumber);
}, []);
```

**✅ GOOD:**
```typescript
// Only sends when user clicks button
<button onClick={() => sendVerificationCode(phoneNumber)} disabled={loading}>
  Send Code
</button>
```

### 3. Disable Button During Request

```typescript
const [loading, setLoading] = useState(false);

const handleSendCode = async () => {
  setLoading(true);
  try {
    await sendVerificationCode(phoneNumber);
  } finally {
    setLoading(false);
  }
};

<button onClick={handleSendCode} disabled={loading}>
  {loading ? 'Sending...' : 'Send Code'}
</button>
```

### 4. Handle Errors Gracefully

```typescript
try {
  await phoneProvider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
} catch (error: any) {
  if (error.code === 'auth/too-many-requests') {
    // Show user-friendly message
    toast({
      title: 'Too Many Attempts',
      description: 'Please try again later or use a different phone number.',
      variant: 'destructive',
    });
    // DON'T retry automatically
  }
}
```

## Production Considerations

### SMS Quota Limits

Firebase has daily SMS limits based on your plan:

**Spark Plan (Free):**
- 10 SMS per day
- Very limited, use test numbers in dev

**Blaze Plan (Pay as you go):**
- First 10,000 verifications: Free
- After that: Check Firebase pricing

### Monitoring Usage

1. Go to: https://console.firebase.google.com/project/lumo-app-183f5/usage
2. Check **Authentication** section
3. Monitor SMS usage

### Rate Limiting

Firebase automatically rate-limits phone auth:
- Too many requests from same IP: `auth/too-many-requests`
- Too many attempts for same number: `auth/quota-exceeded`

**Solutions:**
- Use test numbers in development
- Implement exponential backoff
- Show clear error messages to users
- Consider alternative auth methods for power users

### Security Rules

Add Firestore rules to prevent abuse:

```javascript
// firestore.rules
match /users/{userId} {
  allow create: if request.auth != null &&
                   request.auth.uid == userId &&
                   // Limit to 1 account creation per hour per user
                   request.time > resource.data.createdAt + duration.value(1, 'h');
}
```

## Troubleshooting

### Error: `auth/too-many-requests`

**Cause:** Too many SMS sent to the same number or from same IP

**Solution:**
1. Use test phone numbers during development
2. Wait 1-24 hours before retrying with real numbers
3. Try a different phone number
4. Check if you're in an infinite loop sending SMS

### Error: `auth/quota-exceeded`

**Cause:** Daily SMS quota exceeded

**Solution:**
1. Upgrade to Blaze plan if on Spark plan
2. Use test phone numbers for development
3. Implement better rate limiting in your app
4. Wait until quota resets (daily)

### Error: `auth/invalid-phone-number`

**Cause:** Phone number format is invalid

**Solution:**
- Use E.164 format: `+[country code][number]`
- Example: `+12345678900` (US number)
- Validate format: `/^\+?[1-9]\d{1,14}$/`

### Error: `auth/missing-phone-number`

**Cause:** Phone number not provided

**Solution:**
- Ensure phone number field is required
- Validate input before calling Firebase

### Error: `reCAPTCHA verification failed`

**Cause:** reCAPTCHA container missing or already in use

**Solution:**
1. Ensure `<div id="recaptcha-container"></div>` exists in your form
2. Only create RecaptchaVerifier once (use singleton pattern)
3. Clear verifier before creating new one:
   ```typescript
   if (recaptchaVerifierRef.current) {
     recaptchaVerifierRef.current.clear();
     recaptchaVerifierRef.current = null;
   }
   ```

### Test Numbers Not Working

**Possible Causes:**
1. Test number not configured correctly in Firebase Console
2. Wrong verification code being used
3. Phone provider not enabled
4. Using test numbers in production build

**Solution:**
1. Double-check test number configuration
2. Use exact verification code from Firebase Console
3. Ensure Phone provider is enabled
4. Test numbers only work in development

### Domain Not Authorized

**Error:** `auth/unauthorized-domain`

**Cause:** Current domain not in authorized domains list

**Solution:**
1. Go to Authentication → Settings → Authorized domains
2. Add your domain
3. Wait a few minutes for propagation
4. Clear browser cache and retry

## Best Practices Summary

✅ **DO:**
- Use test phone numbers during development
- Create RecaptchaVerifier as singleton
- Call verifyPhoneNumber only on button click
- Disable button while request is in-flight
- Handle `auth/too-many-requests` gracefully
- Show clear error messages to users
- Monitor SMS usage in production

❌ **DON'T:**
- Auto-send verification codes on page load
- Create multiple RecaptchaVerifiers
- Retry automatically on quota errors
- Use real phone numbers during development
- Ignore rate limit errors
- Leave users stuck without clear messaging

## Testing Checklist

Before deploying to production:

- [ ] Phone authentication enabled in Firebase Console
- [ ] Test phone numbers configured for development
- [ ] Authorized domains include production domain
- [ ] RecaptchaVerifier uses singleton pattern
- [ ] Error handling includes `auth/too-many-requests`
- [ ] Error handling includes `auth/quota-exceeded`
- [ ] Button disabled during verification request
- [ ] SMS usage monitored in Firebase Console
- [ ] Tested with both test and real phone numbers
- [ ] User-friendly error messages shown

## Resources

- [Firebase Phone Auth Docs](https://firebase.google.com/docs/auth/web/phone-auth)
- [reCAPTCHA Documentation](https://firebase.google.com/docs/auth/web/phone-auth#use-recaptcha-verification)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firebase Quotas & Limits](https://firebase.google.com/docs/auth/limits)

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Review browser console for errors
3. Verify all steps in this guide
4. Check Firebase status page for outages
5. Contact Firebase support for quota/billing issues
