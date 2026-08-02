'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';
import Image from 'next/image';
import {
  TrendingUp,
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
  const { connected } = useSocket();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems: { label: string; href: string; icon: any }[] = [
    { label: 'Overview', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Mid-Market', href: ROUTES.STRATEGIES_MID_MARKET, icon: TrendingUp },
    { label: 'Portfolio', href: ROUTES.PORTFOLIO, icon: Wallet },
    { label: 'Trades', href: ROUTES.TRADES, icon: History },
    { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
  ];

  if (user?.isAdmin) {
    navItems.push({ label: 'Admin', href: ROUTES.ADMIN, icon: Shield });
  }

  const now = new Date();
  const formattedTime = `${now.toLocaleString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} UTC`;

  return (
    <>
      {/* Top Header Bar (Brand, Live Status, User Account) */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0F1215] border-b border-[#1B2026] text-xs select-none shadow-md">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center justify-between h-11">
            {/* Left: Brand Logo & Title */}
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="relative h-5 w-5">
                <Image
                  src="/logo.svg"
                  alt="q1t Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-mono text-xs font-bold tracking-[0.15em] text-[#E1E4E8] uppercase">
                Q1T <span className="text-[#586069] mx-1">/</span> TREASURY
              </span>
            </Link>

            {/* Right: Live Ticker & Account Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-[#8B949E] bg-[#16191E] px-2.5 py-1 border border-[#1B2026]">
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    connected ? 'bg-[#20B2AA] animate-pulse' : 'bg-[#E55353]'
                  )}
                />
                <span className={connected ? 'text-[#20B2AA] font-bold' : 'text-[#E55353] font-bold'}>
                  {connected ? 'LIVE' : 'OFFLINE'}
                </span>
                <span className="hidden sm:inline text-[#586069]">• {formattedTime}</span>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#16191E] border border-[#1B2026] hover:border-[#2A313A] transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-[#8B949E]" />
                  <span className="font-mono text-[11px] text-[#E1E4E8] max-w-[120px] truncate hidden sm:inline">
                    {user?.email}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-[#0F1215] border border-[#1B2026] shadow-2xl py-1 z-50 font-mono">
                    <div className="px-3 py-1.5 border-b border-[#1B2026] text-[10px] text-[#586069]">
                      {user?.email}
                    </div>
                    <Link href={ROUTES.SETTINGS} onClick={() => setUserMenuOpen(false)}>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8B949E] hover:bg-[#16191E] hover:text-[#E1E4E8]">
                        <Settings className="h-3.5 w-3.5" />
                        SETTINGS
                      </button>
                    </Link>
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E55353] hover:bg-[#E55353]/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      LOGOUT
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Bottom Navigation Dock (Matte Slate Terminal Bar) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] select-none">
        <div className="bg-[#0F1215] border border-[#1B2026] shadow-2xl px-2 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-2xl">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    'px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all rounded-full flex items-center gap-2 select-none cursor-pointer',
                    isActive
                      ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/40 shadow-sm'
                      : 'text-[#8B949E] hover:text-[#E1E4E8] hover:bg-[#16191E]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Top Spacer */}
      <div className="h-11" />
    </>
  );
}
