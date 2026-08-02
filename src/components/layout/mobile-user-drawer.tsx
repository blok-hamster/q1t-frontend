'use client';

import Link from 'next/link';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { ROUTES } from '@/lib/constants';
import { User, Settings, Shield, LogOut, Radio, CheckCircle2 } from 'lucide-react';

export interface MobileUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileUserDrawer({ isOpen, onClose }: MobileUserDrawerProps) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ACCOUNT & SYSTEM"
      subtitle="Q1T QUANT ENGINE SESSION"
    >
      <div className="space-y-4 font-mono text-xs select-none">
        {/* User Account Card */}
        <div className="p-3 bg-[#080A0C] border border-[#1B2026] space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#16191E] border border-[#20B2AA]/40 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-[#20B2AA]" />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-[#E1E4E8] truncate">{user?.email || 'Quant Trader'}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-[#8B949E] mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-[#20B2AA]" />
                <span>SESSION ACTIVE</span>
                {user?.isAdmin && (
                  <span className="bg-[#20B2AA]/20 text-[#20B2AA] px-1.5 py-0.2 text-[9px] rounded-xs font-bold">
                    ADMIN
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Engine Socket Connection Card */}
        <div className="p-3 bg-[#080A0C] border border-[#1B2026] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#8B949E]" />
            <span className="text-[#8B949E] text-[11px]">HIGH-FREQUENCY FEED</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-[#20B2AA] animate-pulse' : 'bg-[#E55353]'
              }`}
            />
            <span className={connected ? 'text-[#20B2AA] font-bold' : 'text-[#E55353] font-bold'}>
              {connected ? 'CONNECTED (LIVE)' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Quick Menu Actions */}
        <div className="space-y-1.5 pt-1">
          <Link href={ROUTES.SETTINGS} onClick={onClose}>
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-[#16191E] border border-[#1B2026] hover:border-[#20B2AA]/50 text-[#E1E4E8] font-bold uppercase transition-colors rounded-xs cursor-pointer">
              <Settings className="h-4 w-4 text-[#20B2AA]" />
              <span>SETTINGS & API KEYS</span>
            </button>
          </Link>

          {user?.isAdmin && (
            <Link href={ROUTES.ADMIN} onClick={onClose}>
              <button className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-[#16191E] border border-[#1B2026] hover:border-[#20B2AA]/50 text-[#E1E4E8] font-bold uppercase transition-colors rounded-xs cursor-pointer">
                <Shield className="h-4 w-4 text-[#20B2AA]" />
                <span>ADMIN CONTROL PANEL</span>
              </button>
            </Link>
          )}

          <button
            onClick={async () => {
              onClose();
              await logout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-[#E55353]/10 border border-[#E55353]/30 text-[#E55353] font-bold uppercase transition-colors rounded-xs cursor-pointer hover:bg-[#E55353]/20"
          >
            <LogOut className="h-4 w-4" />
            <span>DISCONNECT SESSION</span>
          </button>
        </div>
      </div>
    </MobileBottomSheet>
  );
}
