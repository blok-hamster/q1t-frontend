'use client';

import { Toaster } from 'react-hot-toast';

/**
 * Toast provider component
 * Uses react-hot-toast for notifications
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
        },
        success: {
          iconTheme: {
            primary: 'var(--color-positive)',
            secondary: 'var(--bg-secondary)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--color-negative)',
            secondary: 'var(--bg-secondary)',
          },
          duration: 6000,
        },
      }}
    />
  );
}

// Export toast functions from react-hot-toast
export { toast } from 'react-hot-toast';
