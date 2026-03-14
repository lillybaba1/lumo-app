"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verifying your email...');
  const [errorDetails, setErrorDetails] = useState('');

  const processCallback = useCallback(async () => {
    const supabase = createClient();

    // Check for error in hash fragment (Supabase puts errors in hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashError = hashParams.get('error');
    const hashErrorDescription = hashParams.get('error_description');

    if (hashError) {
      console.error('[Auth Callback] Error from hash:', hashError, hashErrorDescription);
      setStatus('error');
      setMessage('Verification Failed');
      setErrorDetails(hashErrorDescription || hashError || 'The verification link is invalid or has expired.');
      return;
    }

    // Check for query param errors  
    const queryError = searchParams.get('error');
    const queryErrorDesc = searchParams.get('error_description');
    if (queryError) {
      console.error('[Auth Callback] Error from query:', queryError, queryErrorDesc);
      setStatus('error');
      setMessage('Verification Failed');
      setErrorDetails(queryErrorDesc || queryError || 'The verification link is invalid or has expired.');
      return;
    }

    // Check for token_hash in query params (email verification link)
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (tokenHash && type) {
      console.log('[Auth Callback] Verifying OTP with token_hash, type:', type);
      setMessage('Verifying your email...');

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });

      if (verifyError) {
        console.error('[Auth Callback] OTP verification error:', verifyError);
        setStatus('error');
        setMessage('Verification Failed');
        setErrorDetails(verifyError.message);
        return;
      }

      if (data.session) {
        console.log('[Auth Callback] OTP verified, session created');
        await processUserSession(supabase, data.session);
        return;
      }
    }

    // Check for code in query params (PKCE flow)
    const code = searchParams.get('code');
    if (code) {
      console.log('[Auth Callback] Exchanging code for session (PKCE)');
      setMessage('Completing verification...');

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[Auth Callback] Code exchange error:', exchangeError);
        setStatus('error');
        setMessage('Verification Failed');
        setErrorDetails(exchangeError.message);
        return;
      }

      if (data.session) {
        console.log('[Auth Callback] Code exchanged, session created');
        await processUserSession(supabase, data.session);
        return;
      }
    }

    // Check for access_token in hash (implicit flow - Supabase auto-processes this)
    const hashAccessToken = hashParams.get('access_token');
    const hashType = hashParams.get('type');

    if (hashAccessToken) {
      console.log('[Auth Callback] Found access_token in hash, checking session...');
      setMessage('Completing verification...');

      // The Supabase client should auto-detect and process the hash
      // Wait a moment for the client to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[Auth Callback] Session error:', sessionError);
        setStatus('error');
        setMessage('Verification Failed');
        setErrorDetails(sessionError.message);
        return;
      }

      if (session) {
        console.log('[Auth Callback] Session found from hash');
        await processUserSession(supabase, session);
        return;
      }
    }

    // Last resort: check if session was set automatically by Supabase client from hash
    console.log('[Auth Callback] Checking for auto-detected session...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { data: { session: autoSession } } = await supabase.auth.getSession();
    if (autoSession) {
      console.log('[Auth Callback] Auto-detected session found');
      await processUserSession(supabase, autoSession);
      return;
    }

    // Nothing worked
    console.error('[Auth Callback] No valid auth parameters found');
    console.error('[Auth Callback] Hash:', window.location.hash);
    console.error('[Auth Callback] Search:', window.location.search);
    setStatus('error');
    setMessage('Invalid Verification Link');
    setErrorDetails('The verification link is invalid or has expired. Please request a new verification email.');
  }, [searchParams]);

  const processUserSession = async (supabase: any, session: any) => {
    setMessage('Setting up your account...');
    const user = session.user;

    try {
      // Create/update user profile via API
      const response = await fetch('/api/auth/verify-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          phoneNumber: user.user_metadata?.phone_number || user.phone || null,
          role: user.user_metadata?.role || 'PERSONAL_ACCOUNT',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Auth Callback] User profile processed:', result);
      } else {
        console.warn('[Auth Callback] Profile API returned:', response.status);
      }
    } catch (err) {
      console.warn('[Auth Callback] Profile API error (non-fatal):', err);
    }

    // Sign out after verification - user should login manually
    await supabase.auth.signOut();
    console.log('[Auth Callback] User signed out after verification');

    setStatus('success');
    setMessage('Email Verified Successfully!');

    // Redirect to verified page after a brief pause
    setTimeout(() => {
      router.push('/auth/verified');
    }, 1500);
  };

  useEffect(() => {
    processCallback();
  }, [processCallback]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border p-8 text-center">
          {status === 'processing' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100" />
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{message}</h2>
              <p className="text-gray-500 text-sm">Please wait while we verify your account.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{message}</h2>
              <p className="text-gray-500 text-sm">Redirecting you to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{message}</h2>
              {errorDetails && (
                <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">
                  {errorDetails}
                </p>
              )}
              <div className="space-y-3 mt-6">
                <a
                  href="/signup"
                  className="block w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </a>
                <a
                  href="/login"
                  className="block w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Go to Login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-xl border p-8 text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
