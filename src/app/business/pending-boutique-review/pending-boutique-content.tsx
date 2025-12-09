'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Store, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { BusinessAccount } from '@/lib/types';
import { useEffect, useState } from 'react';

interface PendingBoutiqueContentProps {
  businessAccount: BusinessAccount;
}

export default function PendingBoutiqueContent({ businessAccount }: PendingBoutiqueContentProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-blue-500">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-headline">Boutique Under Review</CardTitle>
          <CardDescription>
            Your boutique information is being reviewed by our team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Boutique Info Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Boutique Name</span>
              <span className="font-medium">{businessAccount.businessName}</span>
            </div>
            {businessAccount.boutiqueSlug && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Store URL</span>
                <span className="text-sm font-mono">/boutique/{businessAccount.boutiqueSlug}</span>
              </div>
            )}
            {businessAccount.boutiqueSubmittedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Submitted</span>
                <span className="text-sm">
                  {new Date(businessAccount.boutiqueSubmittedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Almost there!
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Our team is reviewing your boutique details to ensure everything meets our quality standards. 
              Once approved, you'll have full access to your seller dashboard.
            </p>
          </div>

          {/* Timeline */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Your Progress</h4>
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
                <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm">Account Approved</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm">Boutique Data Submitted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">Boutique Review</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm text-muted-foreground">Full Seller Access</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            This usually takes 1-2 business days. We'll email you once it's approved!
          </p>

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
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                Continue Shopping
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Need help? Contact us at <a href="mailto:support@julazone.com" className="underline">support@julazone.com</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
