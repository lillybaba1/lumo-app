'use client';

import { PageError } from '@/components/error-boundary';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const errorLogger = logger.child('AdminError');

/**
 * Admin-specific error boundary
 * Catches errors in admin routes and shows a friendly error page
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    errorLogger.error('Admin route error caught', error);
  }, [error]);

  return (
    <PageError
      title="Admin Error"
      message="The admin panel encountered an error. Please try again or contact support if the issue persists."
      reset={reset}
    />
  );
}
