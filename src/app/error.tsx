'use client';

import { PageError } from '@/components/error-boundary';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const errorLogger = logger.child('RouteError');

/**
 * Route-level error boundary
 * Catches errors in the root layout's children and shows a friendly error page
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    errorLogger.error('Route error caught', error);
  }, [error]);

  return (
    <PageError
      title="Page Error"
      message="This page encountered an error. Please try again."
      reset={reset}
    />
  );
}
