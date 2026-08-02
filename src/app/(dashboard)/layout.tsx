'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navigation } from '@/components/layout/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080A0C]">
        {/* Navigation Top Header & Floating Bottom Dock */}
        <Navigation />

        {/* Main Content with bottom padding for floating dock */}
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
