'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants';
import { MobileUserDrawer } from './mobile-user-drawer';
import { User } from 'lucide-react';

export function MobileHeader() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-12 bg-[#0F1215]/95 backdrop-blur-md border-b border-[#1B2026] px-4 flex items-center justify-between select-none font-mono md:hidden">
        {/* Left: Brand Logo */}
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
          <div className="relative h-5 w-14">
            <Image
              src="/logo.svg"
              alt="Q1T Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        {/* Right: Profile Icon Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center h-8 w-8 bg-[#16191E] border border-[#1B2026] hover:border-[#20B2AA]/60 active:scale-95 transition-all rounded-full text-[#E1E4E8] cursor-pointer"
          aria-label="User Account Drawer"
        >
          <User className="h-4 w-4 text-[#20B2AA]" />
        </button>
      </header>

      {/* Slide-Up Account Sheet */}
      <MobileUserDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Mobile Top Header Spacer */}
      <div className="h-12 md:hidden" />
    </>
  );
}
