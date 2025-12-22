"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const LoginForm = dynamic(() => import('../app/login/login-form'), {
  ssr: false,
});

function LoginFormFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

const ClientLoginForm = () => {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
};

export default ClientLoginForm;