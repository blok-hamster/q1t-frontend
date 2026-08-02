'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';
import Image from 'next/image';
import { MobileHeader } from './mobile-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import {
  LayoutDashboard,
  Wallet,
  History,
  Settings,
  LogOut,
  User,
  Shield,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems: { label: string; href: string; icon: any }[] = [
    { label: 'Overview', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Portfolio', href: ROUTES.PORTFOLIO, icon: Wallet },
    { label: 'Trades', href: ROUTES.TRADES, icon: History },
    { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
  ];

  if (user?.isAdmin) {
    navItems.push({ label: 'Admin', href: ROUTES.ADMIN, icon: Shield });
  }

  return (
    <>
      {/* Mobile Top Header & Mobile Bottom Dock (< md screens) */}
      <MobileHeader />
      <MobileBottomNav />

      {/* Desktop Top Header Bar (>= md screens) */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-[#0F1215]/95 backdrop-blur-md border-b border-[#1B2026] text-xs select-none shadow-md font-mono">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center justify-between h-11">
            {/* Left: Brand Logo */}
            <Link href={ROUTES.DASHBOARD} className="flex items-center hover:opacity-90 transition-opacity">
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

            {/* Right: Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1 bg-[#16191E] border border-[#1B2026] hover:border-[#20B2AA]/50 transition-colors rounded-full cursor-pointer"
              >
                <User className="h-3.5 w-3.5 text-[#20B2AA]" />
                <span className="font-mono text-[11px] text-[#E1E4E8] max-w-[160px] truncate">
                  {user?.email}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-[#0F1215] border border-[#1B2026] shadow-2xl py-1 z-50 font-mono text-xs rounded-xs">
                  <div className="px-3 py-1.5 border-b border-[#1B2026] text-[10px] text-[#586069] truncate">
                    {user?.email}
                  </div>
                  <Link href={ROUTES.SETTINGS} onClick={() => setUserMenuOpen(false)}>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8B949E] hover:bg-[#16191E] hover:text-[#E1E4E8] cursor-pointer">
                      <Settings className="h-3.5 w-3.5" />
                      SETTINGS
                    </button>
                  </Link>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E55353] hover:bg-[#E55353]/10 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    LOGOUT
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Floating Bottom Navigation Dock (>= md screens) */}
      <div className="hidden md:block fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] select-none max-w-[95vw]">
        <div className="bg-[#0F1215]/95 border border-[#1B2026] shadow-2xl px-2 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-2xl">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    'px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all rounded-full flex items-center gap-2 select-none cursor-pointer relative',
                    isActive
                      ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/40 shadow-sm'
                      : 'text-[#8B949E] hover:text-[#E1E4E8] hover:bg-[#16191E]'
                  )}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Top Spacer for Desktop Header */}
      <div className="hidden md:block h-11" />
    </>
  );
}
