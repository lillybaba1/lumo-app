"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Loader2, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { createUserDocument } from '@/services/userService';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'signup' | 'verify'>('signup');

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

    // Validate phone number is provided
    if (!phoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your phone number.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Send email verification
      try {
        const actionCodeSettings = {
          url: `${window.location.origin}/verify-email?email=${encodeURIComponent(user.email || '')}`,
          handleCodeInApp: true,
        };
        
        await sendEmailVerification(user, actionCodeSettings);
        console.log('Email verification sent to:', email);
      } catch (emailError: any) {
        console.error('Failed to send verification email:', emailError);
        toast({
          title: 'Verification Email Failed',
          description: emailError.message || 'Could not send verification email. Please try resending.',
          variant: 'destructive',
        });
        // Don't block signup if email sending fails
      }

      // Step 3: Create user document with phone number
      // react-phone-number-input includes the country code in the value
      const result = await createUserDocument(user.uid, email, name, phoneNumber);

      if (!result.success) {
        // If user document creation fails, delete the auth user
        try {
          await deleteUser(user);
        } catch (deleteError) {
          console.error('Failed to delete user after document creation failure:', deleteError);
        }
        throw new Error(result.message || 'Failed to create user profile');
      }

      // Move to verification step instead of redirecting immediately
      setStep('verify');
      setLoading(false);

    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = 'An unknown error occurred.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
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

  const handleContinue = async () => {
    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Reload user to get latest emailVerified status
      await user.reload();

      if (!user.emailVerified) {
        toast({
          title: 'Email Not Verified',
          description: 'Please check your email and click the verification link before continuing.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Email is verified - create session and login
      toast({
        title: 'Email Verified',
        description: 'Your account is ready!',
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
      console.error('Continue error:', error);

      toast({
        title: 'Error',
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      await sendEmailVerification(user);

      toast({
        title: 'Email Sent',
        description: 'Verification email has been resent. Please check your inbox.',
      });
    } catch (error: any) {
      console.error('Resend email error:', error);

      toast({
        title: 'Error',
        description: error.message || 'Failed to resend email.',
        variant: 'destructive',
      });
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
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={phoneNumber}
                  onChange={(value) => setPhoneNumber(value || '')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter phone number"
                  required
                />
                <p className="text-xs text-muted-foreground">We'll use this for account recovery and notifications</p>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
              </Button>
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
              <CardDescription>We've sent a verification link to {email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Check your email</p>
                    <p className="text-xs text-muted-foreground">
                      Click the verification link we sent to {email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Return here</p>
                    <p className="text-xs text-muted-foreground">
                      After clicking the link, come back and click Continue
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={handleResendEmail}
                  className="underline hover:text-primary"
                  type="button"
                >
                  resend
                </button>
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button onClick={handleContinue} className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  auth.signOut();
                  setStep('signup');
                }}
                disabled={loading}
              >
                Back
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}
