'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Wallet,
  History,
  Settings,
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      label: 'Portfolio',
      href: ROUTES.PORTFOLIO,
      icon: Wallet,
    },
    {
      label: 'Trades',
      href: ROUTES.TRADES,
      icon: History,
    },
    {
      label: 'Settings',
      href: ROUTES.SETTINGS,
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-bg-secondary/80 backdrop-blur-xl border-t border-border">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  'w-full h-full flex flex-col items-center justify-center gap-1 transition-colors',
                  isActive
                    ? 'text-accent-primary'
                    : 'text-text-secondary active:bg-white/5'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5',
                    isActive && 'drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]'
                  )}
                />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
