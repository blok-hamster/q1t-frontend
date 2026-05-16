'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';
import Image from 'next/image';
import {
  TrendingUp,
  LayoutDashboard,
  Wallet,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Users,
  Send,
  Target,
  ChevronDown,
  Layers,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [strategiesOpen, setStrategiesOpen] = useState(false);
  const strategiesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (strategiesRef.current && !strategiesRef.current.contains(e.target as Node)) {
        setStrategiesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  const strategyItems = [
    {
      label: 'Predictions',
      href: ROUTES.STRATEGIES_PREDICTIONS,
      icon: Target,
    },
    {
      label: 'Mid-Market',
      href: ROUTES.STRATEGIES_MID_MARKET,
      icon: TrendingUp,
    },
  ];

  const isStrategyActive = strategyItems.some(s => pathname === s.href);

  // Admin navigation items
  const adminNavItems = user?.isAdmin
    ? [
        {
          label: 'Admin',
          href: ROUTES.ADMIN,
          icon: Shield,
        },
        {
          label: 'Users',
          href: ROUTES.ADMIN_USERS,
          icon: Users,
        },
        {
          label: 'Invites',
          href: ROUTES.ADMIN_INVITES,
          icon: Send,
        },
        {
          label: 'Predictions',
          href: ROUTES.ADMIN_PREDICTIONS,
          icon: Target,
        },
      ]
    : [];


  return (
    <>
      {/* Top Navigation - Desktop & Mobile */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-bg-secondary/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image
                  src="/logo.svg"
                  alt="q1t Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {/* Dashboard */}
              <Link href={ROUTES.DASHBOARD}>
                <button
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === ROUTES.DASHBOARD
                      ? 'bg-accent-muted text-accent-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
              </Link>

              {/* Strategies Dropdown */}
              <div className="relative" ref={strategiesRef}>
                <button
                  onClick={() => setStrategiesOpen(!strategiesOpen)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isStrategyActive
                      ? 'bg-accent-muted text-accent-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  )}
                >
                  <Layers className="h-4 w-4" />
                  Strategies
                  <ChevronDown className={cn('h-3 w-3 transition-transform', strategiesOpen && 'rotate-180')} />
                </button>

                {strategiesOpen && (
                  <div className="absolute left-0 mt-1 w-48 bg-bg-secondary border border-border rounded-md shadow-lg py-1 z-50">
                    {strategyItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setStrategiesOpen(false)}>
                        <button
                          className={cn(
                            'w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors',
                            pathname === item.href
                              ? 'text-accent-primary bg-accent-muted/50'
                              : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Remaining nav items */}
              {navItems.slice(1).map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-accent-muted text-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                </Link>
              ))}

              {/* Admin items */}
              {adminNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-accent-muted text-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    connected ? 'bg-positive' : 'bg-negative'
                  )}
                />
                <span className="text-xs text-text-secondary">
                  {connected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* User Menu (Desktop) */}
              <div className="hidden md:block relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 transition-colors"
                >
                  <User className="h-4 w-4 text-text-secondary" />
                  <span className="text-sm text-text-primary">
                    {user?.email}
                  </span>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-bg-secondary border border-border rounded-md shadow-lg py-1">
                    <Link href={ROUTES.SETTINGS}>
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary">
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                    </Link>
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-negative hover:bg-negative/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md hover:bg-white/5 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-text-primary" />
                ) : (
                  <Menu className="h-6 w-6 text-text-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-accent-muted text-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </Link>
              ))}

              {/* Strategies section */}
              <div className="pt-2 border-t border-border/50 mt-2">
                <p className="px-4 py-1 text-[10px] text-text-tertiary uppercase font-bold">Strategies</p>
                {strategyItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-accent-muted text-accent-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </Link>
                ))}
              </div>

              {/* Admin items */}
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-accent-muted text-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </Link>
              ))}

              <div className="pt-4 border-t border-border mt-4">
                <div className="px-4 py-2">
                  <p className="text-xs text-text-tertiary">Signed in as</p>
                  <p className="text-sm text-text-primary truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-negative hover:bg-negative/10"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from going under fixed nav */}
      <div className="h-16" />
    </>
  );
}
