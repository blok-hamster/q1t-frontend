'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ROUTES } from '@/lib/constants';
import { Shield } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      console.warn('🚨 Unauthorized admin access attempt');
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, loading, router]);

  // Loading state
  if (loading) {
    return <Loading />;
  }

  // Not admin - show access denied
  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-negative mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Access Denied
          </h1>
          <p className="text-text-secondary">
            You don't have permission to access this area. Admin privileges
            required.
          </p>
        </div>
      </div>
    );
  }

  // Admin access granted
  return (
    <div className="space-y-6">
      {/* Admin Badge */}
      <div className="bg-accent-muted border border-accent-primary/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent-primary" />
          <span className="text-sm font-medium text-accent-primary">
            Admin Panel
          </span>
          <span className="text-xs text-text-tertiary ml-auto">
            Logged in as {user.email}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}
