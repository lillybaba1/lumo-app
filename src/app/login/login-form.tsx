"use client";

import { useEffect, useState } from 'react';
// Force rebuild
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Loader2, AlertTriangle, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!cancelled && session) {
          // Check if this is a business user and redirect them appropriately
          const { data: businessAccount } = await supabase
            .from('business_accounts')
            .select('id, status, account_approved, boutique_approved')
            .eq('owner_user_id', session.user.id)
            .single();
          
          if (businessAccount) {
            // Business user - redirect based on their approval status
            const isFullyApproved = businessAccount.status === 'ACTIVE' ||
              (businessAccount.account_approved && businessAccount.boutique_approved);
            
            if (isFullyApproved) {
              window.location.href = '/business/dashboard';
            } else {
              window.location.href = '/business/pending';
            }
            return;
          }
          
          // Check if admin
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (userData?.role === 'admin' || userData?.role === 'APP_OWNER_ADMIN') {
            window.location.href = '/admin/dashboard';
            return;
          }
          
          // Regular user - just show the "already logged in" message
          setHasSession(true);
        }
      } catch (error) {
        console.error('Session pre-check failed:', error);
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Login form submitted', { email });
    setLoading(true);
    setError(null);
    setNeedsVerification(false);

    try {
      console.log('Attempting Supabase sign in...');
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('Failed to sign in');
      }

      console.log('Supabase sign in successful', data.user.id);

      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        console.log('Email not verified');
        setNeedsVerification(true);
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        setLoading(false);
        return;
      }

      console.log('Email verified, checking account type...');
      
      // Check if user has a business account
      const { data: businessAccount } = await supabase
        .from('business_accounts')
        .select('id, status')
        .eq('owner_user_id', data.user.id)
        .single();
      
      if (businessAccount) {
        console.log('Business account found:', businessAccount.status);
        // Business user - always go to pending page first
        // The pending page will handle the redirect logic based on approval status
        window.location.href = '/business/pending';
        return;
      }
      
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      if (userData?.role === 'admin' || userData?.role === 'APP_OWNER_ADMIN') {
        console.log('Admin user, redirecting to admin dashboard');
        window.location.href = '/admin/dashboard';
        return;
      }
      
      console.log('Regular user, redirecting to:', next);
      // Regular user - redirect to requested page or home
      window.location.href = next;
    } catch (e: any) {
      console.error('Login error:', e);
      let errorMessage = 'An unknown error occurred. Please try again.';
       if (e.message?.includes('Invalid login credentials')) {
           errorMessage = 'Invalid email or password.';
       } else if (e.message?.includes('Email not confirmed')) {
           errorMessage = 'Please verify your email before logging in.';
           setNeedsVerification(true);
       } else if (e.message) {
           errorMessage = e.message;
       }
      setError(errorMessage);
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }

      setError('Verification email has been resent. Please check your inbox.');
    } catch (e: any) {
      console.error('Resend verification error:', e);
      setError('Failed to resend verification email. Please try again.');
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
        <form onSubmit={onSubmit}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                 <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Login to Lumo</CardTitle>
            <CardDescription>Welcome back! Please log in to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasSession && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-300">
                  You are already logged in.
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-semibold underline ml-1 text-green-700 dark:text-green-300"
                    onClick={() => window.location.href = next}
                    type="button"
                  >
                    Continue to Dashboard
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant={needsVerification ? "default" : "destructive"}>
                {needsVerification ? <Mail className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertDescription>
                  {error}
                  {needsVerification && (
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal underline ml-1"
                      onClick={handleResendVerification}
                      type="button"
                    >
                      Resend verification email
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Login'}
            </Button>
             <p className="text-xs text-muted-foreground">
              Don't have an account? <Link href="/signup" className="underline">Sign up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
