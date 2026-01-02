'use client';

import { PageError } from '@/components/error-boundary';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const errorLogger = logger.child('GlobalError');

/**
 * Global error page for uncaught errors
 * This provides graceful degradation when a page fails to render
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    errorLogger.error('Global error caught', error);
  }, [error]);

  return (
    <html>
      <body>
        <PageError
          title="Something went wrong"
          message="An unexpected error occurred. Please try again or return to the homepage."
          reset={reset}
        />
      </body>
    </html>
  );
}
