'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Wallet,
  History,
  Settings,
  Shield,
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

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
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[100] select-none font-mono md:hidden max-w-[96vw] w-auto">
      <nav className="bg-[#0F1215]/95 border border-[#1B2026] shadow-2xl px-2 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  'px-3 py-2 font-mono text-xs font-bold uppercase transition-all duration-200 rounded-full flex items-center gap-1.5 select-none cursor-pointer group relative',
                  isActive
                    ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/40 shadow-sm'
                    : 'text-[#8B949E] hover:text-[#E1E4E8] hover:bg-[#16191E]/60 active:scale-95'
                )}
                title={item.label}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-200',
                    isActive && 'scale-110 text-[#20B2AA] drop-shadow-[0_0_6px_rgba(32,178,170,0.6)]'
                  )}
                />

                {/* Show label text when active or on hover */}
                <span
                  className={cn(
                    'text-[10px] tracking-wider uppercase transition-all duration-200 whitespace-nowrap',
                    isActive ? 'inline-block text-[#20B2AA]' : 'hidden group-hover:inline-block text-[#E1E4E8]'
                  )}
                >
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
