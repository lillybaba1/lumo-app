"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status');
  const orderId = searchParams.get('order');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Give the IPN callback a moment to process
    const timer = setTimeout(() => {
      setChecking(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold mb-2">Verifying Payment...</h2>
        <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-fit">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your payment was cancelled. Your order has been saved and you can try again.
            </p>
            {orderId && (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href={`/orders/${orderId}`}>View Order</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success status
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Payment Received!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your payment has been processed successfully. Thank you for your purchase!
          </p>
          {orderId && (
            <div className="space-y-2">
              <p className="text-sm font-mono text-muted-foreground">
                Order #{orderId.substring(0, 8)}
              </p>
              <Button asChild className="w-full">
                <Link href={`/orders/${orderId}`}>View Order Details</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}
