'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Phone, Store, CheckCircle, ArrowRight, RefreshCw, LogOut, Home } from 'lucide-react';
import Link from 'next/link';
import { BusinessAccount } from '@/lib/types';
import { useEffect, useState } from 'react';

interface PendingAccountContentProps {
  businessAccount: BusinessAccount;
}

export default function PendingAccountContent({ businessAccount }: PendingAccountContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Check if we need to show a specific message
  const showBoutiqueRejected = searchParams.get('rejected') === 'true';
  const rejectionReason = businessAccount.boutiqueRejectionReason;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.assign('/login');
      }
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  // Auto-refresh every 30 seconds to check for status updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Header */}
      <header className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold">
              <Store className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">Lumo</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-lg border-orange-500">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-headline">Waiting for Account Approval</CardTitle>
            <CardDescription>
              Please wait for the support team to approve your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          {/* Rejection Notice if boutique was rejected and needs to start over */}
          {showBoutiqueRejected && rejectionReason && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Previous Boutique Submission Rejected
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                {rejectionReason}
              </p>
            </div>
          )}

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
                <span>Once approved, you'll set up your boutique storefront</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>After boutique review, you'll have full seller access</span>
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
                <span className="text-sm font-medium">Pending Account Approval</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm text-muted-foreground">Set Up Boutique</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm text-muted-foreground">Boutique Review</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm text-muted-foreground">Full Seller Access</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Status
            </Button>
            <p className="text-center text-xs text-muted-foreground pt-2">
              Need help? Contact us at <a href="mailto:support@julazone.com" className="underline">support@julazone.com</a>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
