'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if there's a session after the callback
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push(`/auth/error?message=${encodeURIComponent(error.message)}`);
          return;
        }

        if (session) {
          // User is signed in, redirect to home or verified page
          router.push('/auth/verified');
        } else {
          // No session, might be an error
          router.push('/auth/error?message=no_session');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        router.push('/auth/error?message=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your account...</p>
      </div>
    </div>
  );
}
