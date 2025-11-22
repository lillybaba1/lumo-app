"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Loader2, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';


export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'signup' | 'verify'>('signup');

  const isStrongPassword = (value: string) => {
    // At least 8 chars, one uppercase, one lowercase
    return /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(value);
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

    if (!phoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your phone number for verification.',
        variant: 'destructive',
      });
      return;
    }

    if (!isStrongPassword(password)) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 8 characters and include both uppercase and lowercase letters.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;

      // Step 1: Sign up with phone (Supabase phone verification)
      const { data, error: signUpError } = await supabase.auth.signUp({
        phone: fullPhoneNumber,
        password,
        options: {
          data: {
            name,
            email, // Store email in user metadata
            phone_number: fullPhoneNumber,
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      // Step 2: Create user profile in user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: email,
          name: name,
          phone: fullPhoneNumber,
          role: 'user',
        });

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        // Continue anyway - the user is created in auth
      }

      toast({
        title: 'Verification Code Sent',
        description: `Please check your phone at ${fullPhoneNumber} for the verification code.`,
      });

      // Step 3: Show email verification screen
      setStep('verify');
      setLoading(false);

    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = 'An unknown error occurred.';

      if (error.message?.includes('already registered')) {
        errorMessage = 'An account with this email exists.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Invalid email address.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
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

  const handleResendCode = async () => {
    setLoading(true);

    try {
      const supabase = createClient();
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;

      const { error } = await supabase.auth.resend({
        type: 'sms',
        phone: fullPhoneNumber,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Code Resent',
        description: `A new verification code has been sent to ${fullPhoneNumber}`,
      });

      setLoading(false);
    } catch (error: any) {
      console.error('Resend code error:', error);

      toast({
        title: 'Failed to Resend',
        description: error.message || 'Could not resend verification code. Please try again.',
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token: otp,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: 'Account Verified!',
          description: 'Welcome to Lumo! You are now signed in.',
        });

        // Redirect to home or verified page
        router.push('/auth/verified');
      } else {
        throw new Error('Verification failed');
      }

      setLoading(false);
    } catch (error: any) {
      console.error('OTP verification error:', error);

      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code. Please try again.',
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
       <div className="absolute top-4 left-4">
            <Button variant="outline" asChild>
                <Link href="/">Back to Shop</Link>
            </Button>
        </div>
      <Card className="w-full max-w-sm">
        {step === 'signup' ? (
          <form onSubmit={handleSignup}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                   <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
              <CardDescription>Join the Lumo family today!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
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
                  placeholder="you@lumo.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground">For order confirmations and updates</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
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
                    required
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    autoComplete="tel"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Required for account verification</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters, upper & lower case"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={8}
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
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
              </Button>
               <p className="text-xs text-muted-foreground">
                Already have an account? <Link href="/login" className="underline">Log in</Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                   <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Verify Your Phone</CardTitle>
              <CardDescription>We sent a 6-digit code to {countryCode}{phoneNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="123456"
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to your phone</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Sign In'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleResendCode} disabled={loading}>
                Resend Code
              </Button>
              <p className="text-xs text-muted-foreground">
                Didn't receive the code? Check your phone and try resending.
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
