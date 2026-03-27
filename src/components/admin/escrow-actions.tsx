"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EscrowActionsProps {
  orderId: string;
  status: string;
  total: number;
  currencySymbol: string;
}

export function EscrowActions({ orderId, status, total, currencySymbol }: EscrowActionsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleReleasePayout() {
    if (!confirm(`Release payout of ${currencySymbol}${total.toFixed(2)} for this order? This will mark the order as completed.`)) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.error || 'Failed to release payout');
        return;
      }

      setMessage('Payout released successfully! Order marked as completed.');
      router.refresh();
    } catch (error) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveDispute(resolution: 'release' | 'refund') {
    const action = resolution === 'release' ? 'release the payout to the seller' : 'process a refund to the buyer';
    if (!confirm(`Are you sure you want to ${action}?`)) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      if (resolution === 'release') {
        // Release payout despite dispute
        const res = await fetch('/api/admin/orders/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: 'Payout Pending' }),
        });
        if (res.ok) {
          // Then release the payout
          await handleReleasePayout();
          return;
        }
      } else {
        // Mark as cancelled/refunded
        const res = await fetch('/api/admin/orders/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: 'Cancelled', notes: 'Dispute resolved: refund issued' }),
        });
        if (res.ok) {
          setMessage('Order cancelled. Process refund via Modem Pay dashboard.');
          router.refresh();
          return;
        }
      }
      setMessage('Failed to resolve dispute.');
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Escrow Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'Payout Pending' && (
          <>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
              <p className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Buyer confirmed delivery
              </p>
              <p className="text-green-600 dark:text-green-500 mt-1">
                Order total: {currencySymbol}{total.toFixed(2)} — Ready for payout to seller.
              </p>
            </div>
            <Button
              onClick={handleReleasePayout}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><DollarSign className="h-4 w-4 mr-2" /> Release Payout to Seller</>
              )}
            </Button>
          </>
        )}

        {status === 'Disputed' && (
          <>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm">
              <p className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Buyer has disputed this order
              </p>
              <p className="text-red-600 dark:text-red-500 mt-1">
                Review the dispute and decide whether to release payment to seller or refund the buyer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleResolveDispute('release')}
                disabled={loading}
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                Release to Seller
              </Button>
              <Button
                onClick={() => handleResolveDispute('refund')}
                disabled={loading}
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                Refund Buyer
              </Button>
            </div>
          </>
        )}

        {message && (
          <p className={`text-sm text-center ${message.includes('success') || message.includes('completed') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
