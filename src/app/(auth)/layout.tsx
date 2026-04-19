'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import { Loading } from '@/components/ui/loading';
import { ROUTES } from '@/lib/constants';
import { TrendingUp } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (isAuthenticated) {
    return <Loading fullScreen text="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-positive/5" />

      {/* Content */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="relative h-10 w-10">
            <Image
              src="/logo.svg"
              alt="q1t Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Auth form */}
        {children}
      </div>
    </div>
  );
}
