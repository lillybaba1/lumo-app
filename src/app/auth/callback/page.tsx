'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        router.push('/auth/error?message=' + encodeURIComponent(error.message));
        return;
      }

      if (session) {
        router.push('/auth/verified');
      } else {
        // Handle the case where there is no session (e.g. email verification link clicked but session not established yet)
        // For email verification, the hash fragment contains the access token.
        // Supabase client handles this automatically.
        // If we are here and no session, maybe we need to wait a bit or check the URL?
        // But usually getSession() picks it up.
        
        // Fallback: redirect to login
        router.push('/login?message=verification_complete');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your account...</p>
      </div>
    </div>
  );
}
