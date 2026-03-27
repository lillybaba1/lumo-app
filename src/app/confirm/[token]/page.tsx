"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Package, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type ConfirmationState = 'loading' | 'ready' | 'confirming' | 'confirmed' | 'disputed' | 'error';

export default function ConfirmDeliveryPage() {
  const params = useParams();
  const token = params.token as string;
  const [state, setState] = useState<ConfirmationState>('ready');
  const [message, setMessage] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  async function handleConfirm() {
    setState('confirming');
    try {
      const res = await fetch('/api/orders/confirm-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setState('error');
        setMessage(data.error || 'Failed to confirm delivery');
        return;
      }

      setState('confirmed');
      setMessage(data.message || 'Delivery confirmed successfully!');
    } catch (error) {
      setState('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  async function handleDispute() {
    if (!disputeReason.trim()) {
      setMessage('Please describe the issue.');
      return;
    }

    setState('confirming');
    try {
      const res = await fetch('/api/orders/confirm-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'dispute', reason: disputeReason }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setState('error');
        setMessage(data.error || 'Failed to submit dispute');
        return;
      }

      setState('disputed');
      setMessage(data.message || 'Dispute submitted successfully.');
    } catch (error) {
      setState('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        {/* Confirmed State */}
        {state === 'confirmed' && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full p-4 w-20 h-20 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-headline text-green-700 dark:text-green-400">
                Delivery Confirmed! ✅
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                The seller will now receive their payment. Thank you for shopping on JulaZone!
              </p>
              <a href="/" className="inline-block">
                <Button className="w-full">
                  Continue Shopping 🛍️
                </Button>
              </a>
            </CardContent>
          </>
        )}

        {/* Disputed State */}
        {state === 'disputed' && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full p-4 w-20 h-20 flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl font-headline text-amber-700 dark:text-amber-400">
                Dispute Submitted
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Our team will review your dispute and contact you. The seller&apos;s payment has been put on hold.
              </p>
              <a href="/" className="inline-block">
                <Button variant="outline" className="w-full">
                  Back to JulaZone
                </Button>
              </a>
            </CardContent>
          </>
        )}

        {/* Error State */}
        {state === 'error' && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full p-4 w-20 h-20 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-headline text-red-700 dark:text-red-400">
                Something Went Wrong
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Button onClick={() => { setState('ready'); setMessage(''); }} variant="outline" className="w-full">
                Try Again
              </Button>
              <a href="/" className="inline-block w-full">
                <Button variant="ghost" className="w-full">
                  Back to JulaZone
                </Button>
              </a>
            </CardContent>
          </>
        )}

        {/* Loading/Confirming State */}
        {state === 'confirming' && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl font-headline">
                Processing...
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Please wait while we process your request.
              </CardDescription>
            </CardHeader>
          </>
        )}

        {/* Ready State — Awaiting buyer action */}
        {state === 'ready' && !showDispute && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 bg-primary/10 rounded-full p-4 w-20 h-20 flex items-center justify-center">
                <Package className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline">
                Confirm Your Delivery 📦
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Your order from JulaZone has been shipped! Please confirm that you have received your package.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Your payment is held securely in escrow. The seller will only receive payment after you confirm delivery.
                  </p>
                </div>
              </div>

              {message && (
                <p className="text-sm text-red-600 text-center">{message}</p>
              )}

              <Button
                onClick={handleConfirm}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Yes, I Received My Order ✅
              </Button>

              <Button
                onClick={() => setShowDispute(true)}
                variant="outline"
                className="w-full text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report a Problem
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                If you don&apos;t respond within 7 days, delivery will be automatically confirmed.
              </p>
            </CardContent>
          </>
        )}

        {/* Dispute Form */}
        {state === 'ready' && showDispute && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full p-4 w-20 h-20 flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl font-headline">
                Report a Problem
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Tell us what went wrong with your delivery. We&apos;ll investigate and help resolve the issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Please describe the issue (e.g., wrong item received, item damaged, item not received...)"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
                className="resize-none"
              />

              {message && (
                <p className="text-sm text-red-600 text-center">{message}</p>
              )}

              <Button
                onClick={handleDispute}
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={!disputeReason.trim()}
              >
                Submit Dispute
              </Button>

              <Button
                onClick={() => { setShowDispute(false); setMessage(''); }}
                variant="ghost"
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
