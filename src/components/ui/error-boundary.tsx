'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { Card } from './card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({ error, errorInfo });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary when resetKeys change
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys;
      if (
        prevResetKeys &&
        resetKeys.length === prevResetKeys.length &&
        resetKeys.some((key, index) => key !== prevResetKeys[index])
      ) {
        this.reset();
      }
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
          <Card className="max-w-2xl w-full" padding="lg">
            <div className="text-center">
              {/* Error Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-negative/20 mb-6">
                <AlertTriangle className="h-8 w-8 text-negative" />
              </div>

              {/* Error Message */}
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Something went wrong
              </h2>
              <p className="text-text-secondary mb-6">
                An unexpected error occurred. Please try refreshing the page.
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="mb-6 p-4 bg-bg-tertiary rounded-lg text-left">
                  <p className="text-xs font-semibold text-negative uppercase tracking-wide mb-2">
                    Error Details (Development)
                  </p>
                  <p className="text-sm font-mono text-text-primary mb-2">
                    {error.toString()}
                  </p>
                  {errorInfo && (
                    <details className="text-xs font-mono text-text-secondary">
                      <summary className="cursor-pointer hover:text-text-primary">
                        Component Stack
                      </summary>
                      <pre className="mt-2 p-2 bg-bg-primary rounded overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  onClick={this.reset}
                  className="inline-flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => (window.location.href = '/')}
                  className="inline-flex items-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Section Error Boundary - Smaller error UI for page sections
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  section?: string;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Section error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, section } = this.props;

    if (hasError) {
      return (
        <Card padding="lg" className="bg-negative/10 border-negative/30">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-negative mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {section ? `Error in ${section}` : 'Section Error'}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              This section failed to load properly.
            </p>
            {process.env.NODE_ENV === 'development' && error && (
              <p className="text-xs font-mono text-negative mb-4">
                {error.toString()}
              </p>
            )}
            <Button variant="outlined" size="sm" onClick={this.reset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      );
    }

    return children;
  }
}
