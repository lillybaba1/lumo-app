"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const message = searchParams.get('message') || 'unknown_error';
  const details = searchParams.get('details') || '';
  
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);

  const errorMessages: { [key: string]: { title: string; description: string } } = {
    verification_failed: {
      title: 'Email Verification Failed',
      description: 'We could not verify your email. The link may have expired or is invalid.',
    },
    expired_link: {
      title: 'Verification Link Expired',
      description: 'Your verification link has expired. Please request a new one.',
    },
    invalid_token: {
      title: 'Invalid Verification Link',
      description: 'This verification link is not valid. Please check your email for the correct link.',
    },
    unknown_error: {
      title: 'Authentication Error',
      description: 'An unexpected error occurred during authentication.',
    },
  };

  // Check if details contain specific error types
  const getErrorType = () => {
    const detailsLower = details.toLowerCase();
    if (detailsLower.includes('expired') || detailsLower.includes('otp')) {
      return 'expired_link';
    }
    if (detailsLower.includes('invalid')) {
      return 'invalid_token';
    }
    return message;
  };

  const error = errorMessages[getErrorType()] || errorMessages.unknown_error;
  const isExpiredError = getErrorType() === 'expired_link' || getErrorType() === 'verification_failed';

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);
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
        title: 'Verification Email Sent!',
        description: `A new verification link has been sent to ${email}. Check your inbox.`,
      });
      setShowResendForm(false);
      setEmail('');
    } catch (error: any) {
      console.error('Resend error:', error);
      toast({
        title: 'Failed to Resend',
        description: error.message || 'Could not send verification email. Please try signing up again.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="font-headline text-2xl">{error.title}</CardTitle>
          <CardDescription>{error.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Please try signing up again or contact support if the problem persists.
            </p>
          </div>
          
          {details && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                Error details: {decodeURIComponent(details)}
              </p>
            </div>
          )}

          {/* Resend Verification Form */}
          {isExpiredError && showResendForm && (
            <form onSubmit={handleResendVerification} className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="resend-email">Email Address</Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isResending}>
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send New Verification Link
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setShowResendForm(false)}
              >
                Cancel
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {isExpiredError && !showResendForm && (
            <Button 
              className="w-full" 
              variant="default"
              onClick={() => setShowResendForm(true)}
            >
              <Mail className="h-4 w-4 mr-2" />
              Resend Verification Email
            </Button>
          )}
          <Button asChild className={isExpiredError && !showResendForm ? "w-full" : "w-full"} variant={isExpiredError ? "outline" : "default"}>
            <Link href="/signup">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-gray-400" />
            </div>
            <CardTitle className="font-headline text-2xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
