"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/firebaseClient';
import { sendEmailVerification, applyActionCode, checkActionCode } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Auto-check verification status every 3 seconds
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          setVerified(true);
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // If the user clicked the verification link, Firebase will include
  // an oobCode and mode=verifyEmail in the query string. Try to apply
  // the action code automatically so verification completes without
  // requiring the user to sign-in first.
  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');
    if ((mode === 'verifyEmail' || oobCode) && oobCode) {
      (async () => {
        setChecking(true);
        try {
          // First, check the action code so we can show which email it's for
          const info = await checkActionCode(auth, oobCode);
          const actionEmail = (info && (info as any).data && (info as any).data.email) || (info as any).email || email;
          // Inform the user which account will be verified
          toast({ title: 'Verifying email', description: `Verifying ${actionEmail}...` });

          // Apply the action code to complete verification
          await applyActionCode(auth, oobCode);

          setVerified(true);
          toast({ title: 'Email Verified!', description: `Email ${actionEmail} has been verified.` });
          setTimeout(() => router.push('/login'), 1500);
        } catch (err: any) {
          console.error('Auto-apply verification failed:', err);
          // If we can't apply the code automatically, ask the user to sign in
          const msg = err?.code === 'auth/invalid-action-code' ?
            'Verification link is invalid or expired.' :
            'Could not verify automatically. Please sign in and try again.';
          toast({ title: 'Verification failed', description: msg, variant: 'destructive' });
          router.push('/login' + (email ? `?email=${encodeURIComponent(email)}` : ''));
        } finally {
          setChecking(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const user = auth.currentUser;

      // If there's no signed-in user in this tab, guide them to login.
      if (!user) {
        toast({
          title: 'Not signed in',
          description: 'You are not signed in. Please log in to complete verification.',
        });
        router.push('/login' + (email ? `?email=${encodeURIComponent(email)}` : ''));
        return;
      }

      await user.reload();
      if (user.emailVerified) {
        setVerified(true);
        toast({
          title: 'Email Verified!',
          description: 'Your email has been verified. You can now log in.',
        });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast({
          title: 'Not Yet Verified',
          description: 'Please check your email and click the verification link.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to check verification status.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user, {
          url: window.location.origin + '/verify-email?email=' + encodeURIComponent(user.email || email),
          handleCodeInApp: false,
        });
        toast({
          title: 'Verification Email Sent',
          description: 'Please check your email inbox.',
        });
      }
    } catch (error: any) {
      console.error('Error resending verification:', error);
      let errorMessage = 'Failed to resend verification email.';
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="font-headline text-2xl">Email Verified!</CardTitle>
            <CardDescription>Your email has been successfully verified.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">Back to Shop</Link>
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Please check your email inbox and click the verification link to activate your account.
          </p>
          <p className="text-sm text-muted-foreground">
            After verifying, click the button below to continue.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
            <Button onClick={handleCheckVerification} className="w-full" disabled={checking}>
              {checking ? <Loader2 className="animate-spin" /> : 'I\'ve Verified My Email'}
            </Button>

            <Button variant="outline" onClick={() => router.push('/login' + (email ? `?email=${encodeURIComponent(email)}` : ''))} className="w-full">
              Go to Login
            </Button>

            <Button variant="outline" onClick={handleResendEmail} className="w-full" disabled={resending}>
              {resending ? <Loader2 className="animate-spin" /> : 'Resend Verification Email'}
            </Button>
          <p className="text-xs text-muted-foreground text-center">
            Already verified? <Link href="/login" className="underline">Go to login</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
