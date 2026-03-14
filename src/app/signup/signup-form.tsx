"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Loader2, Eye, EyeOff, Mail, CheckCircle2, Store, User } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

type AccountType = 'PERSONAL_ACCOUNT' | 'BUSINESS_ACCOUNT';

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<AccountType>('PERSONAL_ACCOUNT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'account-type' | 'signup' | 'verify'>('account-type');

  // Business account fields
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [website, setWebsite] = useState('');

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const isStrongPassword = (value: string) => {
    // Must match Supabase password policy:
    // At least 12 chars, one uppercase, one lowercase, one number, one special character
    return (
      value.length >= 12 &&
      /[a-z]/.test(value) &&
      /[A-Z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value)
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!isStrongPassword(password)) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.',
        variant: 'destructive',
      });
      return;
    }

    // Validate business fields if business account
    if (accountType === 'BUSINESS_ACCOUNT') {
      if (!businessName || !businessAddress) {
        toast({
          title: 'Missing Business Information',
          description: 'Please provide your business name and address.',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const fullPhoneNumber = phoneNumber ? `${countryCode}${phoneNumber}` : null;

      if (accountType === 'BUSINESS_ACCOUNT') {
        // Business account signup flow
        const response = await fetch('/api/auth/signup-business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name,
            phone: fullPhoneNumber,
            businessName,
            businessAddress,
            businessPhone: businessPhone || fullPhoneNumber,
            taxId,
            website,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 429 || result?.error === 'rate_limit') {
            const message = result?.message || 'Please wait before retrying signup.';
            toast({
              title: 'Rate Limited',
              description: message,
              variant: 'destructive',
            });

            // Extract seconds from message if present
            const match = message.match(/after\s+(\d+)\s*seconds?/i);
            if (match && match[1]) {
              const secs = parseInt(match[1], 10);
              if (!isNaN(secs)) setCooldown(secs);
            }
            setLoading(false);
            return;
          }
          const fieldErrors = result?.details?.fieldErrors;
          if (fieldErrors) {
            const messages = Object.values(fieldErrors).flat().filter(Boolean) as string[];
            if (messages.length > 0) {
              throw new Error(messages.join(', '));
            }
          }
          throw new Error(result.error || result.message || 'Failed to create business account');
        }

        toast({
          title: 'Verification Email Sent',
          description: `Please check your inbox at ${email}. Link expires in 30 minutes.`,
        });

        setStep('verify');
      } else {
        // Personal account signup flow (existing logic)
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              name,
              phone_number: fullPhoneNumber,
              role: 'PERSONAL_ACCOUNT',
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (!data.user) {
          throw new Error('Failed to create user account');
        }

        // Note: User profile will be created in /auth/callback AFTER email verification
        // This ensures only verified users exist in user_profiles table

        toast({
          title: 'Verification Email Sent',
          description: `Please check your inbox at ${email}. Link expires in 30 minutes.`,
        });

        setStep('verify');
      }

      setLoading(false);

    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = 'An unknown error occurred.';

      if (error.message?.includes('already registered')) {
        errorMessage = 'An account with this email exists.';
      } else if (error.message?.includes('Business name already taken') || error.message?.includes('business with this name already exists')) {
        errorMessage = 'This business name is already taken. Please choose a different name.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Invalid email address.';
      } else if (error.message?.includes('Password') || error.message?.includes('password')) {
        errorMessage = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Email Resent',
        description: `A new verification email has been sent to ${email}`,
      });

      setLoading(false);
    } catch (error: any) {
      console.error('Resend email error:', error);

      toast({
        title: 'Failed to Resend',
        description: error.message || 'Could not resend verification email. Please try again.',
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

  // Popular country codes
  const countryCodes = [
    { code: '+1', name: 'US/Canada' },
    { code: '+44', name: 'UK' },
    { code: '+91', name: 'India' },
    { code: '+86', name: 'China' },
    { code: '+81', name: 'Japan' },
    { code: '+49', name: 'Germany' },
    { code: '+33', name: 'France' },
    { code: '+61', name: 'Australia' },
    { code: '+55', name: 'Brazil' },
    { code: '+52', name: 'Mexico' },
    { code: '+34', name: 'Spain' },
    { code: '+39', name: 'Italy' },
    { code: '+7', name: 'Russia' },
    { code: '+82', name: 'South Korea' },
    { code: '+62', name: 'Indonesia' },
    { code: '+27', name: 'South Africa' },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
       <div className="absolute top-4 left-4">
            <Button variant="outline" asChild>
                <Link href="/">Back to Shop</Link>
            </Button>
        </div>
      <Card className="w-full max-w-md">
        {step === 'account-type' ? (
          <div>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Choose Account Type</CardTitle>
              <CardDescription>Select the type of account you want to create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={accountType} onValueChange={(value) => setAccountType(value as AccountType)}>
                <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="PERSONAL_ACCOUNT" id="personal" className="mt-1" />
                  <Label htmlFor="personal" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-5 w-5" />
                      <span className="font-semibold">Personal Account</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      For individual shoppers. Browse products and make purchases.
                    </p>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="BUSINESS_ACCOUNT" id="business" className="mt-1" />
                  <Label htmlFor="business" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="h-5 w-5" />
                      <span className="font-semibold">Business Account</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      For sellers. List your products and manage your business on our marketplace.
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                className="w-full"
                onClick={() => setStep('signup')}
              >
                Continue
              </Button>
            </CardFooter>
          </div>
        ) : step === 'signup' ? (
          <form onSubmit={handleSignup}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {accountType === 'BUSINESS_ACCOUNT' ? (
                  <Store className="h-8 w-8 text-primary" />
                ) : (
                  <ShoppingBag className="h-8 w-8 text-primary" />
                )}
              </div>
              <CardTitle className="font-headline text-2xl">
                {accountType === 'BUSINESS_ACCOUNT' ? 'Create Business Account' : 'Create an Account'}
              </CardTitle>
              <CardDescription>
                {accountType === 'BUSINESS_ACCOUNT'
                  ? 'Join as a seller and start selling today'
                  : 'Join the JulaZone family today!'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {accountType === 'BUSINESS_ACCOUNT' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Your Business LLC"
                      required
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Business Address *</Label>
                    <Textarea
                      id="businessAddress"
                      placeholder="123 Main St, Suite 100, City, State, ZIP"
                      required
                      value={businessAddress}
                      onChange={e => setBusinessAddress(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {accountType === 'BUSINESS_ACCOUNT' ? 'Contact Person Name *' : 'Full Name'}
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Doe"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@julazone.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground">For order confirmations and updates</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {accountType === 'BUSINESS_ACCOUNT' ? 'Contact Phone Number' : 'Phone Number (Optional)'}
                </Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map(({ code, name }) => (
                        <SelectItem key={code} value={code}>
                          {code} {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="5551234567"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    autoComplete="tel"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {accountType === 'BUSINESS_ACCOUNT'
                    ? 'For customer inquiries and order updates'
                    : 'For order updates and notifications'}
                </p>
              </div>
              {accountType === 'BUSINESS_ACCOUNT' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / Business Registration Number (Optional)</Label>
                    <Input
                      id="taxId"
                      type="text"
                      placeholder="XX-XXXXXXX"
                      value={taxId}
                      onChange={e => setTaxId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Required for tax reporting</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Business Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourbusiness.com"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 12 chars, upper, lower, number & symbol"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={12}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be 12+ characters with uppercase, lowercase, number, and special character (!@#$...)
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('account-type')}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || cooldown > 0}>
                  {loading ? <Loader2 className="animate-spin" /> : cooldown > 0 ? `Wait ${cooldown}s` : 'Create Account'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Already have an account? <Link href="/login" className="underline">Log in</Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <div>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                   <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Verify Your Email</CardTitle>
              <CardDescription>We sent a verification link to {email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200 text-center font-medium">
                  ⏱️ This link expires in 30 minutes
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Check your email</p>
                    <p className="text-xs text-muted-foreground">
                      We sent a verification link to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Click the verification link</p>
                    <p className="text-xs text-muted-foreground">
                      Open your email and click the confirmation link
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">You&apos;ll be logged in automatically</p>
                    <p className="text-xs text-muted-foreground">
                      After verifying, you&apos;ll be redirected to the homepage
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  onClick={handleResendEmail}
                  className="underline hover:text-primary"
                  type="button"
                  disabled={loading}
                >
                  resend
                </button>
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep('signup')}
                disabled={loading}
              >
                Back to Signup
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}
