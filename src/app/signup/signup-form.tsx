"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Loader2, Eye, EyeOff, Mail, CheckCircle2, Store, User, AlertTriangle, ArrowLeft, ArrowRight, Shield, Sparkles, Lock, Check, X, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { CountryPicker } from '@/components/country-picker';
import { COUNTRIES, type Country, validatePhoneForCountry, formatE164 } from '@/lib/countries';

type AccountType = 'PERSONAL_ACCOUNT' | 'BUSINESS_ACCOUNT';
type SignupMethod = 'email' | 'phone';

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<AccountType>('PERSONAL_ACCOUNT');
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('phone');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Gambia default
  const [countryCode, setCountryCode] = useState('+220');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
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

  // Business name availability state
  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const nameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedName = useRef('');

  // Debounced business name availability check
  const checkBusinessName = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setNameStatus('idle');
      setNameSuggestions([]);
      return;
    }
    if (trimmed.toLowerCase() === lastCheckedName.current.toLowerCase()) return;
    lastCheckedName.current = trimmed;
    setNameStatus('checking');
    try {
      const res = await fetch(`/api/auth/check-business-name?name=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      // Only update if the name hasn't changed since we started
      if (trimmed.toLowerCase() !== lastCheckedName.current.toLowerCase()) return;
      if (data.available) {
        setNameStatus('available');
        setNameSuggestions([]);
      } else {
        setNameStatus('taken');
        setNameSuggestions(data.suggestions || []);
      }
    } catch {
      setNameStatus('idle');
    }
  }, []);

  const handleBusinessNameChange = useCallback((value: string) => {
    setBusinessName(value);
    setNameStatus('idle');
    setNameSuggestions([]);
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
    nameCheckTimer.current = setTimeout(() => checkBusinessName(value), 500);
  }, [checkBusinessName]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => { if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current); };
  }, []);

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

    // Validate based on signup method
    if (signupMethod === 'email') {
      if (!email) {
        toast({
          title: 'Email Required',
          description: 'Please enter your email address.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Phone method
      if (!phoneNumber) {
        toast({
          title: 'Phone Number Required',
          description: 'Please enter your phone number.',
          variant: 'destructive',
        });
        return;
      }
      if (!validatePhoneForCountry(phoneNumber, selectedCountry)) {
        toast({
          title: 'Invalid Phone Number',
          description: `Please enter a valid phone number for ${selectedCountry.name}. Expected ${selectedCountry.maxLength} digits.`,
          variant: 'destructive',
        });
        return;
      }
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
      if (nameStatus === 'taken') {
        toast({
          title: 'Business Name Unavailable',
          description: 'This business name is already taken. Please choose a different name.',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    try {
      const fullPhoneNumber = phoneNumber ? formatE164(selectedCountry.dialCode, phoneNumber) : null;

      // Check if phone number already has an account
      if (signupMethod === 'phone' && fullPhoneNumber) {
        const phoneCheck = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(fullPhoneNumber)}`);
        const phoneCheckData = await phoneCheck.json();
        if (phoneCheckData.exists) {
          toast({
            title: 'Phone Number Already Registered',
            description: 'An account with this phone number already exists. Please sign in instead, or use a different number.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      if (accountType === 'BUSINESS_ACCOUNT') {
        // Business account signup flow
        const response = await fetch('/api/auth/signup-business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signupMethod,
            email: signupMethod === 'email' ? email : undefined,
            phone: fullPhoneNumber,
            password,
            name,
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

          // Handle email validation errors specifically
          if (result?.error_code === 'email_address_invalid') {
            toast({
              title: 'Email Could Not Be Verified',
              description: result.error || 'We couldn\'t verify this email address. Please double-check for typos, or try a different email.',
              variant: 'destructive',
            });
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

        if (signupMethod === 'phone') {
          setOtpSent(true);
          toast({
            title: 'Verification Code Sent',
            description: `We sent a 6-digit code to ${selectedCountry.dialCode} ${phoneNumber}. Enter it below to verify your account.`,
          });
        } else {
          toast({
            title: 'Verification Email Sent',
            description: `Please check your inbox at ${email}. If you don't see it, check your spam/junk folder. Link expires in 30 minutes.`,
          });
        }

        setStep('verify');
      } else {
        // Personal account signup flow
        const supabase = createClient();

        if (signupMethod === 'phone') {
          // Phone signup: use Supabase phone auth
          const fullPhone = formatE164(selectedCountry.dialCode, phoneNumber);

          const { data, error: signUpError } = await supabase.auth.signUp({
            phone: fullPhone,
            password,
            options: {
              data: {
                name,
                phone_number: fullPhone,
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

          setOtpSent(true);
          toast({
            title: 'Verification Code Sent',
            description: `We sent a 6-digit code to ${selectedCountry.dialCode} ${phoneNumber}. Enter it below to verify your account.`,
          });

          setStep('verify');
        } else {
          // Email signup flow (existing logic)
          const fullPhoneNumber = phoneNumber ? `${selectedCountry.dialCode}${phoneNumber}` : null;
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

          toast({
            title: 'Verification Email Sent',
            description: `Please check your inbox at ${email}. If you don't see it, check your spam/junk folder. Link expires in 30 minutes.`,
          });

          setStep('verify');
        }
      }

      setLoading(false);

    } catch (error: any) {
      console.error('Signup error:', error);

      let errorTitle = 'Signup Failed';
      let errorMessage = 'An unknown error occurred.';

      const msg = error.message || '';
      const code = error.code || error.error_code || '';

      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already in use')) {
        errorMessage = signupMethod === 'phone'
          ? 'An account with this phone number already exists. Please sign in instead.'
          : 'An account with this email already exists. Please sign in instead.';
      } else if (msg.includes('Business name already taken') || msg.includes('business with this name already exists')) {
        errorMessage = 'This business name is already taken. Please choose a different name.';
      } else if (code === 'email_address_invalid' || msg.includes('email_address_invalid') || (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('invalid'))) {
        errorTitle = 'Email Could Not Be Verified';
        errorMessage = 'We couldn\'t verify this email address. Please double-check for typos, or try a different email address.';
      } else if (msg.includes('Password') || msg.includes('password')) {
        errorMessage = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character.';
      } else if (msg.includes('rate') || msg.includes('Rate') || msg.includes('too many')) {
        errorTitle = 'Too Many Attempts';
        errorMessage = 'Please wait a moment before trying again.';
      } else if (msg) {
        errorMessage = msg;
      }

      toast({
        title: errorTitle,
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
        description: `A new verification email has been sent to ${email}. Check your spam folder too!`,
      });

      // Set cooldown to prevent rapid resends
      setCooldown(120);

      setLoading(false);
    } catch (error: any) {
      console.error('Resend email error:', error);

      const msg = error.message || '';
      let description = 'Could not resend verification email. Please try again.';

      if (msg.includes('rate') || msg.includes('Rate') || msg.includes('security') || error.status === 429) {
        // Extract seconds from message if present
        const match = msg.match(/after\s+(\d+)\s*seconds?/i);
        const secs = match ? parseInt(match[1], 10) : 120;
        setCooldown(secs);
        description = `Please wait ${secs} seconds before requesting another email.`;
      }

      toast({
        title: 'Could Not Resend',
        description,
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const fullPhone = formatE164(selectedCountry.dialCode, phoneNumber);

      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Phone Verified! 🎉',
        description: 'Your account has been created successfully.',
      });

      // Redirect to home page or dashboard
      router.push('/');
    } catch (error: any) {
      console.error('OTP verification error:', error);

      const msg = error.message || '';
      let description = 'The code you entered is incorrect. Please try again.';

      if (msg.includes('expired')) {
        description = 'This code has expired. Please request a new one.';
      } else if (msg.includes('Invalid') || msg.includes('invalid')) {
        description = 'Invalid verification code. Please check and try again.';
      }

      toast({
        title: 'Verification Failed',
        description,
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);

    try {
      const supabase = createClient();
      const fullPhone = formatE164(selectedCountry.dialCode, phoneNumber);

      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        throw error;
      }

      setOtp('');
      toast({
        title: 'Code Resent',
        description: `A new verification code has been sent to ${selectedCountry.dialCode} ${phoneNumber}.`,
      });

      setCooldown(60);
      setLoading(false);
    } catch (error: any) {
      console.error('Resend OTP error:', error);

      const msg = error.message || '';
      let description = 'Could not resend code. Please try again.';

      if (msg.includes('rate') || msg.includes('Rate') || error.status === 429) {
        const match = msg.match(/after\s+(\d+)\s*seconds?/i);
        const secs = match ? parseInt(match[1], 10) : 60;
        setCooldown(secs);
        description = `Please wait ${secs} seconds before requesting another code.`;
      }

      toast({
        title: 'Could Not Resend',
        description,
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (value: string) => {
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value)) score++;
    return score; // 0-6
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabel = passwordStrength <= 2 ? 'Weak' : passwordStrength <= 4 ? 'Fair' : 'Strong';
  const strengthColor = passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 4 ? 'bg-amber-500' : 'bg-green-500';

  // Password requirement checks
  const pwChecks = {
    length: password.length >= 12,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center py-8 px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/"><ArrowLeft className="h-4 w-4" /> Back to Shop</Link>
        </Button>
      </div>

      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        {step !== 'account-type' && (
          <div className="mb-6 flex items-center justify-center gap-2">
            {['account-type', 'signup', 'verify'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  s === step ? 'bg-primary scale-125' :
                  ['account-type', 'signup', 'verify'].indexOf(s) < ['account-type', 'signup', 'verify'].indexOf(step) ? 'bg-primary' :
                  'bg-muted-foreground/20'
                }`} />
                {i < 2 && <div className={`h-0.5 w-8 transition-all duration-300 ${
                  ['account-type', 'signup', 'verify'].indexOf(s) < ['account-type', 'signup', 'verify'].indexOf(step) ? 'bg-primary' : 'bg-muted-foreground/20'
                }`} />}
              </div>
            ))}
          </div>
        )}

        <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
        {step === 'account-type' ? (
          <div>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex justify-center mb-3">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-7 w-7 text-primary" />
                </div>
              </div>
              <CardTitle className="font-headline text-2xl tracking-tight">Join JulaZone</CardTitle>
              <CardDescription className="text-base">How would you like to get started?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6">
              <RadioGroup value={accountType} onValueChange={(value) => setAccountType(value as AccountType)}>
                <label
                  htmlFor="personal"
                  className={`flex items-start space-x-4 border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                    accountType === 'PERSONAL_ACCOUNT'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/30'
                  }`}
                >
                  <RadioGroupItem value="PERSONAL_ACCOUNT" id="personal" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-semibold">Personal Account</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                      Browse products, save favorites, and make purchases.
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="business"
                  className={`flex items-start space-x-4 border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                    accountType === 'BUSINESS_ACCOUNT'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/30'
                  }`}
                >
                  <RadioGroupItem value="BUSINESS_ACCOUNT" id="business" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Store className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="font-semibold">Business Account</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                      Set up your boutique, list products, and start selling.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 px-6 pb-8">
              <Button
                type="button"
                className="w-full h-11 text-base gap-2"
                onClick={() => setStep('signup')}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </div>
        ) : step === 'signup' ? (
          <form onSubmit={handleSignup}>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex justify-center mb-3">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
                  accountType === 'BUSINESS_ACCOUNT' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-primary/10'
                }`}>
                  {accountType === 'BUSINESS_ACCOUNT' ? (
                    <Store className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <User className="h-7 w-7 text-primary" />
                  )}
                </div>
              </div>
              <CardTitle className="font-headline text-2xl tracking-tight">
                {accountType === 'BUSINESS_ACCOUNT' ? 'Create Business Account' : 'Create Your Account'}
              </CardTitle>
              <CardDescription className="text-base">
                {accountType === 'BUSINESS_ACCOUNT'
                  ? 'Set up your seller profile to start selling'
                  : 'Fill in your details to get started'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              {/* Signup method toggle - for both personal and business accounts */}
              <div className="flex rounded-lg bg-muted p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setSignupMethod('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                      signupMethod === 'phone'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupMethod('email')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                      signupMethod === 'email'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                </div>
              {accountType === 'BUSINESS_ACCOUNT' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-medium">Business Name <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="Your Business LLC"
                        required
                        value={businessName}
                        onChange={e => handleBusinessNameChange(e.target.value)}
                        className={`h-11 ${nameStatus === 'taken' ? 'border-amber-500 focus-visible:ring-amber-500' : nameStatus === 'available' ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                      />
                      {nameStatus === 'checking' && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {nameStatus === 'available' && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {nameStatus === 'taken' && (
                        <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    {nameStatus === 'taken' && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                          This business name is already taken.
                        </p>
                        {nameSuggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-amber-700 dark:text-amber-300 mb-1.5">Try one of these instead:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {nameSuggestions.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors font-medium"
                                  onClick={() => {
                                    setBusinessName(s);
                                    setNameStatus('idle');
                                    setNameSuggestions([]);
                                    lastCheckedName.current = '';
                                    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
                                    nameCheckTimer.current = setTimeout(() => checkBusinessName(s), 300);
                                  }}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {nameStatus === 'available' && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> This name is available
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress" className="text-sm font-medium">Business Address <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="businessAddress"
                      placeholder="123 Main St, Suite 100, City, State, ZIP"
                      required
                      value={businessAddress}
                      onChange={e => setBusinessAddress(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div className="border-t border-dashed my-1" />
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  {accountType === 'BUSINESS_ACCOUNT' ? 'Contact Person Name' : 'Full Name'} <span className="text-red-500">*</span>
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
                  className="h-11"
                />
              </div>
              {/* Conditional fields based on signup method */}
              {signupMethod === 'email' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">We&apos;ll send a verification link to this email</p>
                  </div>
                  {/* Optional phone for email signup */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <div className="flex gap-2">
                      <CountryPicker
                        value={selectedCountry.code}
                        onChange={(country) => {
                          setSelectedCountry(country);
                          setCountryCode(country.dialCode);
                        }}
                      />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder={selectedCountry.maxLength ? '0'.repeat(selectedCountry.maxLength) : '1234567890'}
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        autoComplete="tel"
                        className="flex-1 h-11"
                        maxLength={selectedCountry.maxLength || 15}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Phone signup method */
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <CountryPicker
                      value={selectedCountry.code}
                      onChange={(country) => {
                        setSelectedCountry(country);
                        setCountryCode(country.dialCode);
                      }}
                    />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder={selectedCountry.maxLength ? '0'.repeat(selectedCountry.maxLength) : '1234567890'}
                      required
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      autoComplete="tel"
                      className="flex-1 h-11"
                      maxLength={selectedCountry.maxLength || 15}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">We&apos;ll send a verification code via SMS to this number</p>
                </div>
              )}
              {accountType === 'BUSINESS_ACCOUNT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="taxId" className="text-sm font-medium">Tax ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="taxId"
                      type="text"
                      placeholder="XX-XXXXXXX"
                      value={taxId}
                      onChange={e => setTaxId(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium">Website <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://..."
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={12}
                    className="pr-10 h-11"
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
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${
                            i <= passwordStrength ? strengthColor : 'bg-transparent'
                          }`} />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 4 ? 'text-amber-500' : 'text-green-500'
                      }`}>{strengthLabel}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {[
                        { key: 'length', label: '12+ characters' },
                        { key: 'lower', label: 'Lowercase letter' },
                        { key: 'upper', label: 'Uppercase letter' },
                        { key: 'number', label: 'Number' },
                        { key: 'special', label: 'Special character' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          {pwChecks[key as keyof typeof pwChecks] ? (
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                          )}
                          <span className={`text-xs ${pwChecks[key as keyof typeof pwChecks] ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 px-6 pb-8">
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="gap-1"
                  onClick={() => setStep('account-type')}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button type="submit" size="lg" className="flex-1 h-11 text-base gap-2" disabled={loading || cooldown > 0}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                  ) : cooldown > 0 ? (
                    `Wait ${cooldown}s`
                  ) : (
                    <>Create Account <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-4 pt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" /> Secure
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Encrypted
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <div>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex justify-center mb-3">
                <div className="h-14 w-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  {signupMethod === 'phone' ? (
                    <Smartphone className="h-7 w-7 text-green-600 dark:text-green-400" />
                  ) : (
                    <Mail className="h-7 w-7 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </div>
              <CardTitle className="font-headline text-2xl tracking-tight">
                {signupMethod === 'phone' ? 'Verify Your Phone' : 'Check Your Email'}
              </CardTitle>
              <CardDescription className="text-base">
                {signupMethod === 'phone' ? (
                  <>We sent a 6-digit code to <strong className="text-foreground">{selectedCountry.dialCode} {phoneNumber}</strong></>
                ) : (
                  <>We sent a verification link to <strong className="text-foreground">{email}</strong></>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              {signupMethod === 'phone' ? (
                /* Phone OTP verification */
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200 text-center font-medium flex items-center justify-center gap-2">
                      <span>📱</span> Enter the code sent to your phone
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full h-11 text-base gap-2"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                    ) : (
                      <>Verify & Continue <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs text-center text-muted-foreground">
                      Didn&apos;t receive the code?{' '}
                      {cooldown > 0 ? (
                        <span className="text-muted-foreground font-medium">Resend in {cooldown}s</span>
                      ) : (
                        <button
                          onClick={handleResendOtp}
                          className="text-primary font-medium hover:underline"
                          type="button"
                          disabled={loading}
                        >
                          Resend code
                        </button>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                /* Email verification */
                <>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200 text-center font-medium flex items-center justify-center gap-2">
                      <span>⏱️</span> This link expires in 30 minutes
                    </p>
                  </div>
                  <div className="space-y-1">
                    {[
                      { title: 'Open your email inbox', desc: `Look for an email from JulaZone at ${email}` },
                      { title: 'Check spam/junk folder', desc: 'New senders sometimes land in spam — also check Gmail\'s Promotions tab' },
                      { title: 'Click the verification link', desc: 'Confirm your email address to activate your account' },
                      { title: 'Start exploring', desc: accountType === 'BUSINESS_ACCOUNT' ? 'Set up your boutique once approved' : 'Browse products and start shopping' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{i + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs text-center text-muted-foreground">
                      Didn&apos;t receive the email?{' '}
                      {cooldown > 0 ? (
                        <span className="text-muted-foreground font-medium">Resend available in {cooldown}s</span>
                      ) : (
                        <button
                          onClick={handleResendEmail}
                          className="text-primary font-medium hover:underline"
                          type="button"
                          disabled={loading}
                        >
                          Resend verification email
                        </button>
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 px-6 pb-8">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2"
                onClick={() => setStep('signup')}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Signup
              </Button>
            </CardFooter>
          </div>
        )}
        </Card>

        {/* Trust badges */}
        {step === 'account-type' && (
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure signup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Free to join</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Data protected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
