"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'unknown_error';
  const details = searchParams.get('details') || '';

  const errorMessages: { [key: string]: { title: string; description: string } } = {
    verification_failed: {
      title: 'Email Verification Failed',
      description: 'We could not verify your email. The link may have expired or is invalid.',
    },
    unknown_error: {
      title: 'Authentication Error',
      description: 'An unexpected error occurred during authentication.',
    },
  };

  const error = errorMessages[message] || errorMessages.unknown_error;

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
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
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
