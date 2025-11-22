'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from URL parameters (sent by Supabase email verification)
        const code = searchParams.get('code');

        if (code) {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Code exchange error:', error);
            router.push(`/auth/error?message=${encodeURIComponent(error.message)}`);
            return;
          }

          if (data.session) {
            // Successfully logged in, redirect to verified page
            router.push('/auth/verified');
            return;
          }
        }

        // If no code, check if there's already a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push(`/auth/error?message=${encodeURIComponent(error.message)}`);
          return;
        }

        if (session) {
          // User is signed in, redirect to verified page
          router.push('/auth/verified');
        } else {
          // No session and no code
          router.push('/auth/error?message=no_session');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        router.push('/auth/error?message=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your account...</p>
      </div>
    </div>
  );
}
