"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Loader2, AlertTriangle, Eye, EyeOff, Mail, CheckCircle2, ArrowLeft, ArrowRight, Shield, Lock } from 'lucide-react';
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
      
      // Record login for IP tracking (fire and forget)
      fetch('/api/auth/record-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginType: 'password' }),
      }).catch(console.error);
      
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

      setError('Verification email resent! Check your inbox and spam/junk folder.');
      setNeedsVerification(false);
    } catch (e: any) {
      console.error('Resend verification error:', e);
      const msg = e.message || '';
      if (msg.includes('rate') || msg.includes('Rate') || msg.includes('security') || e.status === 429) {
        setError('Please wait 2 minutes before requesting another verification email.');
      } else {
        setError('Failed to resend verification email. Please try again later.');
      }
    }
  }

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

      <div className="w-full max-w-sm">
        <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
          <form onSubmit={onSubmit}>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex justify-center mb-3">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-7 w-7 text-primary" />
                </div>
              </div>
              <CardTitle className="font-headline text-2xl tracking-tight">Welcome Back</CardTitle>
              <CardDescription className="text-base">Sign in to your JulaZone account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              {hasSession && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900 rounded-lg">
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
                <Alert variant={needsVerification ? "default" : "destructive"} className="rounded-lg">
                  {needsVerification ? <Mail className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertDescription>
                    {error}
                    {needsVerification && (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium underline ml-1 text-primary"
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
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pr-10 h-11"
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
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 px-6 pb-8">
              <Button type="submit" size="lg" className="w-full h-11 text-base gap-2" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
              <div className="flex items-center justify-center gap-4 pt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" /> Secure
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Encrypted
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary font-medium hover:underline">Create one</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
