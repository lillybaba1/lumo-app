
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Loader2, Eye, EyeOff, Phone } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, RecaptchaVerifier, PhoneAuthProvider, linkWithCredential, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { createUserDocument } from '@/services/userService';


export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [step, setStep] = useState<'signup' | 'verify'>('signup');

  // Use ref to store recaptchaVerifier to ensure singleton pattern
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Initialize RecaptchaVerifier only once
  const getRecaptchaVerifier = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved - user verified
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          // reCAPTCHA expired - reset it
          console.log('reCAPTCHA expired');
          recaptchaVerifierRef.current = null;
        }
      });
    }
    return recaptchaVerifierRef.current;
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    // Validate phone number format (basic check)
    if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number with country code (e.g., +1234567890)',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    let userCredential = null;

    try {
      // Step 1: Create user with email/password
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Send SMS verification code
      try {
        const recaptchaVerifier = getRecaptchaVerifier();

        const phoneProvider = new PhoneAuthProvider(auth);
        const verificationIdResult = await phoneProvider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);

        setVerificationId(verificationIdResult);
        setStep('verify');

        toast({
          title: 'Verification Code Sent',
          description: `A 6-digit code has been sent to ${phoneNumber}`,
        });

        setLoading(false);
      } catch (phoneError: any) {
        // Phone verification failed - delete the user we just created
        console.error('Phone verification failed, cleaning up user:', phoneError);
        try {
          await deleteUser(user);
          console.log('Partially created user deleted');
        } catch (deleteError) {
          console.error('Failed to delete partially created user:', deleteError);
        }

        // Re-throw the original phone error
        throw phoneError;
      }
    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = 'An unknown error occurred.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number. Include country code (e.g., +1234567890).';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Phone authentication is not enabled. Please contact support.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many verification attempts. Please try again later or use a different phone number.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later or contact support.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. The domain may not be authorized. Please contact support.';
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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationId || !verificationCode) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the verification code.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Verify the SMS code
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Link phone credential to the user account
      await linkWithCredential(user, credential);

      // Create user document in Firestore with phone number
      const result = await createUserDocument(user.uid, email, name, phoneNumber);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create user profile');
      }

      toast({
        title: 'Account Created',
        description: "Welcome to Lumo! Your phone is verified.",
      });

      // Create a server-side session cookie
      const idToken = await user.getIdToken(true);
      const r = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ idToken }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed to set session');

      // Redirect to home
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Verification error:', error);

      let errorMessage = 'Verification failed.';

      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code expired. Please request a new one.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

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
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1234567890"
                    required
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    autoComplete="tel"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for USA)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={6}
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
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="w-full flex justify-center">
                <div id="recaptcha-container"></div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Send Verification Code'}
              </Button>
               <p className="text-xs text-muted-foreground">
                Already have an account? <Link href="/login" className="underline">Log in</Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                   <Phone className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Verify Your Phone</CardTitle>
              <CardDescription>Enter the 6-digit code sent to {phoneNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  name="verification-code"
                  type="text"
                  placeholder="123456"
                  required
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  autoComplete="one-time-code"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Create Account'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep('signup')}
                disabled={loading}
              >
                Back
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

