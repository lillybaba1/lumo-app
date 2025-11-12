"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function EmailVerifiedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    checkVerification();
  }, []);

  const checkVerification = async () => {
    try {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setVerified(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('Verification check error:', error);
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {loading ? (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            ) : verified ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <CheckCircle2 className="h-12 w-12 text-gray-400" />
            )}
          </div>
          <CardTitle className="font-headline text-2xl">
            {loading ? 'Verifying...' : verified ? 'Email Verified!' : 'Verification Status'}
          </CardTitle>
          <CardDescription>
            {loading
              ? 'Please wait while we verify your email...'
              : verified
              ? 'Your account has been successfully verified.'
              : 'We could not verify your session.'}
          </CardDescription>
        </CardHeader>

        {!loading && verified && (
          <>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your email has been verified and you're now logged in. You can start shopping!
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleContinue} className="w-full">
                Continue to Shop
              </Button>
            </CardFooter>
          </>
        )}

        {!loading && !verified && (
          <>
            <CardContent>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  We couldn't verify your session. Please try logging in.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
