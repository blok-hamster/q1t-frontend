'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to error reporting service (e.g., Sentry)
    console.error('Global error caught:', error, errorInfo);

    // You can add error tracking here:
    // if (typeof window !== 'undefined') {
    //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  };

  return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
}
