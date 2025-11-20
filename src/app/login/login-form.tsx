"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Loader2, AlertTriangle, Eye, EyeOff, Mail, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signInWithEmailAndPassword, RecaptchaVerifier, PhoneAuthProvider, signInWithCredential, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { getUserById } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  function getRecaptchaVerifier() {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
        }
      });
    }
    return window.recaptchaVerifier;
  }

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'same-origin',
        });

        if (!cancelled && response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            window.location.href = next;
          }
        }
      } catch (error) {
        console.error('Session pre-check failed:', error);
      }
    }

    validateSession();

    // If this page was opened via a sign-in email link, handle it.
    async function handleEmailLinkSignIn() {
      try {
        const href = typeof window !== 'undefined' ? window.location.href : '';
        if (isSignInWithEmailLink(auth, href)) {
          // Try to get email from localStorage (set when link was requested) or from the URL param
          const storedEmail = typeof window !== 'undefined' ? window.localStorage.getItem('emailForSignIn') : null;
          const emailFromParam = searchParams.get('email') || '';
          const signInEmail = storedEmail || emailFromParam || email;
          if (!signInEmail) {
            // Can't complete sign-in without the email; prompt the user to enter it in the form.
            console.warn('Sign-in link present but no email available to complete sign-in.');
            return;
          }

          const cred = await signInWithEmailLink(auth, signInEmail, href);
          // Remove stored email after successful sign-in
          if (typeof window !== 'undefined') window.localStorage.removeItem('emailForSignIn');

          // Proceed with session creation similar to password flow
          await cred.user.reload();
          const idToken = await cred.user.getIdToken(true);
          const r = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ idToken }),
          });
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed to set session');
          // Redirect to next
          window.location.href = next;
        }
      } catch (err) {
        console.error('Email-link sign-in failed:', err);
        // Let the normal flow handle it; user can sign in with password.
      }
    }

    handleEmailLinkSignIn();

    return () => {
      cancelled = true;
    };
  }, [next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Login form submitted', { email });
    setLoading(true);
    setError(null);
    try {
      console.log('Attempting Firebase sign in...');
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign in successful', cred.user.uid);

      // Sign out immediately - we'll only complete login after phone verification
      await auth.signOut();

      // Get user's phone number from Firestore
      const user = await getUserById(cred.user.uid);

      if (!user?.phoneNumber) {
        throw new Error('No phone number registered. Please contact support.');
      }

      setPhoneNumber(user.phoneNumber);

      // Send SMS verification code
      const recaptchaVerifier = getRecaptchaVerifier();

      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationIdResult = await phoneProvider.verifyPhoneNumber(user.phoneNumber, recaptchaVerifier);

      setVerificationId(verificationIdResult);
      setStep('verify');
      setLoading(false);

    } catch (e: any) {
      console.error('Login error:', e);
      let errorMessage = 'An unknown error occurred. Please try again.';
       if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
           errorMessage = 'Invalid email or password.';
       } else if (e.code === 'auth/too-many-requests') {
           errorMessage = 'Too many login attempts. Please try again later or use a different phone number.';
       } else if (e.code === 'auth/quota-exceeded') {
           errorMessage = 'SMS quota exceeded. Please try again later or contact support.';
       } else if (e.code === 'auth/captcha-check-failed') {
           errorMessage = 'reCAPTCHA verification failed. The domain may not be authorized. Please contact support.';
       } else if (e.message) {
           errorMessage = e.message;
       }
      setError(errorMessage);
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();

    if (!verificationId || !verificationCode) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify the SMS code and sign in with phone credential
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const result = await signInWithCredential(auth, credential);

      console.log('Phone verification successful', result.user.uid);
      const idToken = await result.user.getIdToken(true);
      console.log('ID token retrieved');

      console.log('Creating session cookie...');
      const r = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ idToken }),
      });
      console.log('Session API response:', r.status, r.statusText);
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed to set session');

      console.log('Login successful, redirecting to:', next);
      // Hard reload so middleware/server see the new cookie
      window.location.href = next;
    } catch (e: any) {
      console.error('Verification error:', e);
      let errorMessage = 'Verification failed. Please try again.';

      if (e.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please try again.';
      } else if (e.code === 'auth/code-expired') {
        errorMessage = 'Verification code expired. Please log in again.';
      } else if (e.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">Back to Shop</Link>
        </Button>
      </div>
      <Card className="w-full max-w-sm">
        {step === 'login' ? (
          <form onSubmit={onSubmit}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                   <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Login to Lumo</CardTitle>
              <CardDescription>Welcome back! Please log in to your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="current-password"
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
              <div id="recaptcha-container"></div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
              </Button>
               <p className="text-xs text-muted-foreground">
                Don't have an account? <Link href="/signup" className="underline">Sign up</Link>
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
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
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
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('login');
                  setError(null);
                  setVerificationCode('');
                }}
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
