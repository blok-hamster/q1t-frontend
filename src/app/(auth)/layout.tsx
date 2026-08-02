'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import { Loading } from '@/components/ui/loading';
import { ROUTES, APP_NAME } from '@/lib/constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <Loading fullScreen text="AUTHENTICATING..." />;
  }

  if (isAuthenticated) {
    return <Loading fullScreen text="REDIRECTING TO TERMINAL..." />;
  }

  return (
    <div className="min-h-screen bg-[#080A0C] text-[#E1E4E8] font-mono flex items-center justify-center p-4">
      <div className="relative w-full max-w-md space-y-6">
        {/* Terminal Brand Header */}
        <div className="flex flex-col items-center justify-center gap-2 select-none">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image
                src="/logo.svg"
                alt={`${APP_NAME} logo`}
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-sm font-mono font-bold tracking-[0.15em] text-[#E1E4E8]">
              Q1T <span className="text-[#586069] mx-1">/</span> TREASURY
            </span>
          </div>
          <p className="text-[10px] font-mono text-[#586069] uppercase tracking-wide">
            REAL-TIME BITCOIN SIGNAL EXECUTION
          </p>
        </div>

        {/* Auth form container */}
        <div className="bg-[#0F1215] border border-[#1B2026] p-6 shadow-2xl space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
