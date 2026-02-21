"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingBag, Loader2, Eye, EyeOff, Mail, Phone, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CountryCodeSelector } from '@/components/country-code-selector';
import { validateEmailQuick } from '@/lib/email-validation';
import { validatePhoneNumber, normalizePhoneNumber, formatPhoneNumber } from '@/lib/phone-validation';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Step = 'account' | 'verification' | 'success';

interface ValidationState {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
}

export default function EnhancedSignupForm() {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [step, setStep] = useState<Step>('account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationState>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    score: 0,
  });

  // Real-time email validation
  useEffect(() => {
    if (touched.email && email) {
      const result = validateEmailQuick(email);
      if (!result.valid) {
        setErrors(prev => ({ ...prev, email: result.error }));
        if (result.suggestions && result.suggestions.length > 0) {
          setEmailSuggestion(result.suggestions[0]);
        }
      } else {
        setErrors(prev => ({ ...prev, email: undefined }));
        setEmailSuggestion(null);
      }
    }
  }, [email, touched.email]);

  // Real-time password validation
  useEffect(() => {
    const strength = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      score: 0,
    };

    strength.score = [strength.length, strength.uppercase, strength.lowercase, strength.number].filter(Boolean).length;
    setPasswordStrength(strength);

    if (touched.password && password) {
      if (!strength.length) {
        setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      } else if (!strength.uppercase || !strength.lowercase || !strength.number) {
        setErrors(prev => ({ ...prev, password: 'Password must contain uppercase, lowercase, and number' }));
      } else {
        setErrors(prev => ({ ...prev, password: undefined }));
      }
    }
  }, [password, touched.password]);

  // Real-time phone validation
  useEffect(() => {
    if (touched.phone && phoneNumber) {
      const normalized = normalizePhoneNumber(phoneNumber, countryCode);
      const result = validatePhoneNumber(normalized);

      if (!result.valid) {
        setErrors(prev => ({ ...prev, phone: result.error }));
      } else {
        setErrors(prev => ({ ...prev, phone: undefined }));
      }
    }
  }, [phoneNumber, countryCode, touched.phone]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ name: true, email: true, password: true, phone: true });

    // Validate all fields
    const newErrors: ValidationState = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailResult = validateEmailQuick(email);
    if (!emailResult.valid) {
      newErrors.email = emailResult.error;
    }

    if (passwordStrength.score < 4) {
      newErrors.password = 'Please meet all password requirements';
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber, countryCode);
    const phoneResult = validatePhoneNumber(normalizedPhone);
    if (!phoneResult.valid) {
      newErrors.phone = phoneResult.error;
    }

    if (!acceptedTerms) {
      toast({
        title: 'Terms Required',
        description: 'You must accept the Terms of Service to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (!acceptedPrivacy) {
      toast({
        title: 'Privacy Policy Required',
        description: 'You must accept the Privacy Policy to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          phone: phoneResult.normalized,
          countryCode,
          acceptedTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.suggestions && data.suggestions.length > 0) {
          setEmailSuggestion(data.suggestions[0]);
        }

        toast({
          title: 'Signup Failed',
          description: data.error || 'Failed to create account',
          variant: 'destructive',
        });

        if (data.retryAfter) {
          setTimeout(() => setLoading(false), data.retryAfter * 1000);
        } else {
          setLoading(false);
        }
        return;
      }

      setUserId(data.userId);
      setStep('verification');
      toast({
        title: 'Account Created!',
        description: 'Please check your phone for the verification code.',
      });
      setLoading(false);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber, countryCode);

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Verification Failed',
          description: data.error || 'Invalid verification code',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      setStep('success');
      setLoading(false);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber, countryCode);

      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Failed to Resend',
          description: data.error || 'Could not resend code',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your phone.',
      });
      setLoading(false);
    } catch (error: any) {
      console.error('Resend error:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend code. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-gray-200';
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score === 0) return '';
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score === 3) return 'Good';
    return 'Strong';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">Back to Shop</Link>
        </Button>
      </div>

      <Card className="w-full max-w-md">
        {step === 'account' && (
          <form onSubmit={handleAccountSubmit}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Create Your Account</CardTitle>
              <CardDescription>Join JulaZone - Shop with confidence</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Doe"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  autoComplete="name"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && touched.name && (
                  <p id="name-error" className="text-sm text-red-500" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : (emailSuggestion ? 'email-suggestion' : undefined)}
                />
                {errors.email && touched.email && (
                  <p id="email-error" className="text-sm text-red-500" role="alert">
                    {errors.email}
                  </p>
                )}
                {emailSuggestion && !errors.email && (
                  <p id="email-suggestion" className="text-sm text-blue-600">
                    Did you mean{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(emailSuggestion);
                        setEmailSuggestion(null);
                      }}
                      className="underline font-medium"
                    >
                      {emailSuggestion}
                    </button>
                    ?
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Required for login and order confirmations
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    minLength={8}
                    className="pr-10"
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby="password-requirements"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{getPasswordStrengthText()}</span>
                    </div>
                    <div id="password-requirements" className="text-xs space-y-1">
                      <div className={`flex items-center gap-1 ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.length ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.uppercase ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        <span>One uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.lowercase ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        <span>One lowercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.number ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.number ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        <span>One number</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <CountryCodeSelector
                    value={countryCode}
                    onChange={setCountryCode}
                    disabled={loading}
                  />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="5551234567"
                    required
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    onBlur={() => handleBlur('phone')}
                    autoComplete="tel"
                    className="flex-1"
                    aria-required="true"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : 'phone-help'}
                  />
                </div>
                {errors.phone && touched.phone && (
                  <p id="phone-error" className="text-sm text-red-500" role="alert">
                    {errors.phone}
                  </p>
                )}
                <p id="phone-help" className="text-xs text-muted-foreground">
                  We&apos;ll send a verification code to this number
                </p>
              </div>

              {/* Terms and Privacy */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    aria-required="true"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the{' '}
                    <Link href="/pages/terms" className="text-primary underline" target="_blank">
                      Terms of Service
                    </Link>
                    <span className="text-red-500"> *</span>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={acceptedPrivacy}
                    onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                    aria-required="true"
                  />
                  <Label
                    htmlFor="privacy"
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the{' '}
                    <Link href="/pages/privacy" className="text-primary underline" target="_blank">
                      Privacy Policy
                    </Link>
                    <span className="text-red-500"> *</span>
                  </Label>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Your account requires both email and phone verification before activation.
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href="/login" className="underline text-primary">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        )}

        {step === 'verification' && (
          <form onSubmit={handleVerificationSubmit}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Verify Your Phone</CardTitle>
              <CardDescription>
                We&apos;ve sent a 6-digit code to {countryCode} {phoneNumber}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                  required
                  aria-required="true"
                  aria-describedby="code-help"
                />
                <p id="code-help" className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={handleResendCode}
                  className="underline hover:text-primary"
                  type="button"
                  disabled={loading}
                >
                  Resend
                </button>
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Continue'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep('account')}
                disabled={loading}
              >
                Back
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 'success' && (
          <div>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="font-headline text-2xl">Account Verified!</CardTitle>
              <CardDescription>
                Your account has been successfully created and verified.
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Redirecting you to the shop...
              </p>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
}
