# 🔐 Login 2FA Implementation Plan

## Overview
Implement two-factor authentication (2FA) for login using phone SMS verification. This is an **optional** security feature that only activates if the user has a phone number in their profile.

## User Experience

### Without Phone Number
```
1. User enters email + password
2. Click "Login"
3. ✅ Logged in immediately
```

### With Phone Number
```
1. User enters email + password
2. Click "Login"
3. System checks if phone exists
4. Shows: "Verification code sent to xxx-xxx-1234"
5. User enters 6-digit code
6. Click "Verify"
7. ✅ Logged in after verification
```

## Implementation Steps

### 1. Update Login Form (`/src/app/login/page.tsx`)

Add state for 2FA:
```tsx
const [step, setStep] = useState<'login' | 'verify-2fa'>('login')
const [verificationCode, setVerificationCode] = useState('')
const [phoneLastDigits, setPhoneLastDigits] = useState('')
const [verificationId, setVerificationId] = useState('')
```

### 2. Modify Login Handler

After successful email/password login:
```tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    // Step 1: Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Step 2: Check if user has phone number
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('id', data.user.id)
      .single()

    if (profile?.phone) {
      // Step 3: Send SMS verification code
      const response = await fetch('/api/auth/send-2fa-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id }),
      })

      const result = await response.json()

      if (result.success) {
        setVerificationId(result.verificationId)
        setPhoneLastDigits(result.phoneLastDigits)
        setStep('verify-2fa')
      } else {
        // If SMS fails, allow login anyway
        toast({ title: 'Warning', description: 'Could not send verification code. Logging in without 2FA.' })
        router.push('/')
      }
    } else {
      // No phone number, log in immediately
      router.push('/')
    }
  } catch (error) {
    // Handle errors
  } finally {
    setLoading(false)
  }
}
```

### 3. Add Verification Code Input

In login form, add conditional rendering:
```tsx
{step === 'verify-2fa' && (
  <div className="space-y-4">
    <p className="text-sm text-center">
      We sent a verification code to your phone ending in {phoneLastDigits}
    </p>
    <Input
      type="text"
      placeholder="Enter 6-digit code"
      value={verificationCode}
      onChange={(e) => setVerificationCode(e.target.value)}
      maxLength={6}
    />
    <Button onClick={handleVerifyCode}>Verify</Button>
    <Button variant="ghost" onClick={handleResendCode}>Resend Code</Button>
  </div>
)}
```

### 4. Create API Route: `/api/auth/send-2fa-code`

```typescript
// /src/app/api/auth/send-2fa-code/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Twilio } from 'twilio'

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    const supabase = await createClient()

    // Get user's phone number
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('id', userId)
      .single()

    if (!profile?.phone) {
      return NextResponse.json({ success: false, error: 'No phone number' })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Store code in database with expiry (5 minutes)
    await supabase
      .from('verification_codes')
      .insert({
        user_id: userId,
        code: code,
        type: '2fa_login',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      })

    // Send SMS via Twilio
    await twilioClient.messages.create({
      body: `Your Lumo verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: profile.phone,
    })

    // Return last 4 digits for display
    const lastDigits = profile.phone.slice(-4)

    return NextResponse.json({
      success: true,
      verificationId: userId, // Use userId as verification ID
      phoneLastDigits: `***-***-${lastDigits}`,
    })
  } catch (error) {
    console.error('Send 2FA code error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send code' })
  }
}
```

### 5. Create API Route: `/api/auth/verify-2fa-code`

```typescript
// /src/app/api/auth/verify-2fa-code/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json()
    const supabase = await createClient()

    // Check if code exists and is not expired
    const { data: verification } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('type', '2fa_login')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!verification) {
      return NextResponse.json({ success: false, error: 'Invalid or expired code' })
    }

    // Delete used code
    await supabase
      .from('verification_codes')
      .delete()
      .eq('id', verification.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verify 2FA code error:', error)
    return NextResponse.json({ success: false, error: 'Verification failed' })
  }
}
```

### 6. Create Database Migration

```sql
-- Create verification_codes table
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT NOT NULL, -- 'email_verify', '2fa_login', 'password_reset'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own codes
CREATE POLICY "Users can read own verification codes"
  ON verification_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### 7. Setup Twilio

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get phone number for sending SMS
3. Get Account SID and Auth Token
4. Add to `.env.local`:
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### 8. Install Twilio SDK

```bash
npm install twilio
```

### 9. Add Verification Handler in Login Form

```tsx
const handleVerifyCode = async () => {
  setLoading(true)

  try {
    const response = await fetch('/api/auth/verify-2fa-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: verificationId,
        code: verificationCode,
      }),
    })

    const result = await response.json()

    if (result.success) {
      toast({ title: 'Success', description: 'Verification successful!' })
      router.push('/')
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Invalid verification code',
        variant: 'destructive',
      })
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to verify code',
      variant: 'destructive',
    })
  } finally {
    setLoading(false)
  }
}
```

## Testing

### Test Cases

1. **Login without phone number**
   - User signs up without phone
   - Login should work immediately without 2FA

2. **Login with phone number**
   - User signs up with phone
   - Login triggers SMS code
   - Enter correct code → logged in
   - Enter wrong code → error message

3. **Code expiry**
   - Wait 5+ minutes after receiving code
   - Try to verify → should show expired error

4. **Resend code**
   - Click "Resend Code"
   - New code sent
   - Old code should not work

### Test Accounts

Create test users:
```bash
# Without phone
Email: test@example.com
Phone: (none)
Expected: Login immediately

# With phone
Email: test-2fa@example.com
Phone: +1234567890
Expected: Login requires SMS code
```

## Security Considerations

1. **Rate Limiting**
   - Limit SMS sends to 3 per 15 minutes per user
   - Prevent brute force code attempts

2. **Code Expiry**
   - Codes expire after 5 minutes
   - Old codes automatically deleted

3. **One-Time Use**
   - Codes can only be used once
   - Delete after successful verification

4. **Fallback**
   - If SMS fails, allow login without 2FA
   - Log the failure for monitoring

5. **User Control**
   - Users can disable 2FA in profile settings
   - Remove phone number to disable 2FA

## Cost Estimation

Twilio SMS Pricing (approximate):
- $0.0079 per SMS in US
- 100 logins/day = $0.79/day = $23.70/month
- 1000 logins/day = $7.90/day = $237/month

Consider:
- Free tier: 15.50 credits (~$15 worth)
- Alternative: Use email-based 2FA (free)
- Alternative: Use authenticator app (free)

## Alternative: Email-Based 2FA

If SMS costs are too high:
1. Send 6-digit code via email instead
2. Same flow, but free
3. Less secure but better than nothing

## Documentation

Update these files:
- `LOGIN_2FA_SETUP.md` - Setup instructions
- `SECURITY_CHECKLIST.md` - Add 2FA verification
- `USER_GUIDE.md` - Explain 2FA to users

## Rollout Plan

### Phase 1: Development
- ✅ Create API routes
- ✅ Update login form
- ✅ Setup Twilio
- ✅ Create database migration
- ✅ Add tests

### Phase 2: Testing
- Test with real phone numbers
- Verify SMS delivery
- Test error cases
- Load testing

### Phase 3: Deployment
- Deploy to staging
- Run smoke tests
- Deploy to production
- Monitor logs

### Phase 4: User Communication
- Send email to all users
- Explain new 2FA feature
- Show how to add phone number
- Highlight security benefits

---

**Estimated Time**: 4-6 hours
**Complexity**: Medium
**Priority**: Low (security enhancement)
**Dependencies**: Twilio account, SMS credits
