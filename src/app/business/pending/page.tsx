import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Store } from 'lucide-react';
import Link from 'next/link';
import { getBusinessAccountByOwner } from '@/services/businessAccountService';
import { Suspense } from 'react';
import PendingAccountContent from './pending-account-content';

export default async function BusinessPendingPage() {
  let authUser = null;
  
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authUser = data?.user;
  } catch (error) {
    console.error('[BusinessPending] Error getting user:', error);
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Session Expired</CardTitle>
            <CardDescription>Please log in again to continue.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get business account
  let businessAccount = null;
  try {
    businessAccount = await getBusinessAccountByOwner(authUser.id);
    console.log('[BusinessPending] Business account state:', {
      id: businessAccount?.id,
      status: businessAccount?.status,
      accountApproved: businessAccount?.accountApproved,
      boutiqueSubmitted: businessAccount?.boutiqueSubmitted,
      boutiqueApproved: businessAccount?.boutiqueApproved,
    });
  } catch (error) {
    console.error('[BusinessPending] Error getting business account:', error);
  }

  if (!businessAccount) {
    // No business account - show error instead of redirect
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Business Account</CardTitle>
            <CardDescription>You don&apos;t have a business account yet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 items-center">
            <Button asChild>
              <Link href="/signup?type=business">Sign Up as Business</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // LEGACY CHECK FIRST: If status is ACTIVE, treat as fully approved (backwards compatibility)
  // This handles accounts created before the multi-phase approval system
  if (businessAccount.status === 'ACTIVE') {
    redirect('/business/dashboard');
  }

  // Multi-phase approval state machine
  // State D: Fully approved - go to dashboard
  if (businessAccount.accountApproved && businessAccount.boutiqueApproved) {
    redirect('/business/dashboard');
  }

  // State C: Account approved, boutique submitted but not approved yet
  if (businessAccount.accountApproved && businessAccount.boutiqueSubmitted && !businessAccount.boutiqueApproved) {
    redirect('/business/pending-boutique-review');
  }

  // State B: Account approved but boutique not set up yet
  if (businessAccount.accountApproved && !businessAccount.boutiqueSubmitted) {
    redirect('/business/setup-boutique');
  }

  // If suspended, show suspension message
  if (businessAccount.status === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-red-500">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-headline">Account Suspended</CardTitle>
            <CardDescription>
              Your business account has been suspended
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              Your business account application was not approved or has been suspended. 
              If you believe this is an error, please contact our support team.
            </p>

            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                Contact support at <a href="mailto:support@julazone.com" className="underline font-medium">support@julazone.com</a>
              </p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Return to Homepage
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending verification - need to verify email first
  if (businessAccount.status === 'PENDING_VERIFICATION') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-yellow-500">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
            <CardDescription>
              Please verify your email to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              We've sent a verification link to <strong>{businessAccount.contactEmail}</strong>. 
              Please check your inbox and click the link to verify your email address.
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Once verified, your application will be reviewed by our team.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link href="/auth/error?message=expired_link">
                  Resend Verification Email
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">
                  Return to Homepage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State A: PENDING_APPROVAL - Account not yet approved by admin
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PendingAccountContent businessAccount={businessAccount} />
    </Suspense>
  );
}
