import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Phone, Store, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getBusinessAccountByOwner } from '@/services/businessAccountService';

export default async function BusinessPendingPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?redirect=/business/pending');
  }

  // Get business account
  const businessAccount = await getBusinessAccountByOwner(authUser.id);

  if (!businessAccount) {
    // No business account - redirect to signup
    redirect('/signup');
  }

  // If already active, redirect to dashboard
  if (businessAccount.status === 'ACTIVE') {
    redirect('/business/dashboard');
  }

  // If suspended, show different message
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
                Contact support at <a href="mailto:support@lumo.app" className="underline font-medium">support@lumo.app</a>
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

  // PENDING_APPROVAL - Main case
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-orange-500">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-headline">Application Under Review</CardTitle>
          <CardDescription>
            Your business account is being reviewed by our team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Info Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">{businessAccount.businessName}</p>
                <p className="text-sm text-muted-foreground">{businessAccount.businessAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm">{businessAccount.contactEmail}</p>
            </div>
            {businessAccount.businessPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">{businessAccount.businessPhone}</p>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Our team will review your business information</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>We may contact you if additional information is needed</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>You'll receive an email once your account is approved</span>
              </li>
            </ul>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            This usually takes 1-2 business days. Thank you for your patience!
          </p>

          {/* Timeline */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Application Progress</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm">Account Created</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm">Email Verified</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">Pending Admin Review</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm text-muted-foreground">Account Activated</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Continue Shopping
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Need help? Contact us at <a href="mailto:support@lumo.app" className="underline">support@lumo.app</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
