'use client';

import { useState } from 'react';
import { BalanceCard } from './balance-card';
import { DepositAddress } from './deposit-address';
import { PortfolioPnlChart } from './portfolio-pnl-chart';
import { CalendarPnl } from './calendar-pnl';
import { TransactionHistory } from './transaction-history';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import type { Balance } from '@/types/api';
import type { Trade } from '@/types/trade';
import type { Transaction } from './transaction-history';
import {
  Wallet,
  DollarSign,
  ShieldCheck,
  ExternalLink,
  Zap,
  ArrowDownCircle,
  TrendingUp,
  QrCode,
  ChevronDown,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface MobilePortfolioViewProps {
  balances: Balance | null;
  depositAddress: string | null;
  walletType: 'eoa' | 'proxy';
  transactions: Transaction[];
  trades: Trade[];
  allTimePnL: number;
  loading: boolean;
}

function MobileCollapsibleChart({ trades, allTimePnL }: { trades: Trade[]; allTimePnL: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] rounded-xs overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 flex items-center justify-between cursor-pointer hover:bg-[#16191E]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-[#20B2AA]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[#20B2AA]" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
            CUMULATIVE P&L CHART
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] uppercase px-1.5 py-0.5 rounded-xs bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/20">
            <Activity className="h-2.5 w-2.5" /> LIVE
          </span>
        </div>
        <span className="text-[10px] text-[#8B949E]">
          {open ? 'COLLAPSE' : 'EXPAND'}
        </span>
      </button>
      {open && <PortfolioPnlChart trades={trades} allTimePnL={allTimePnL} height={250} />}
    </div>
  );
}

export function MobilePortfolioView({
  balances,
  depositAddress,
  walletType,
  transactions,
  trades,
  allTimePnL,
  loading,
}: MobilePortfolioViewProps) {
  const [depositOpen, setDepositOpen] = useState(false);
  const totalUsd = balances?.totalUsd || 0;
  const isPositivePnL = allTimePnL >= 0;

  return (
    <div className="md:hidden space-y-3 font-mono text-xs select-none">
      {/* Mobile Treasury Hero Card */}
      <div className="p-4 bg-[#0F1215] border border-[#1B2026] rounded-xs space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#586069] text-[10px] font-bold uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5 text-[#20B2AA]" />
            <span>TOTAL TREASURY VALUE</span>
          </div>

          <span
            className={cn(
              'px-2 py-0.5 text-[9px] font-bold uppercase rounded-xs border flex items-center gap-1',
              isPositivePnL
                ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                : 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30'
            )}
          >
            <TrendingUp className="h-2.5 w-2.5" />
            <span>{isPositivePnL ? '+' : ''}${allTimePnL.toFixed(2)} P&L</span>
          </span>
        </div>

        {/* Balance Amount */}
        <div>
          <h2 className="text-2xl font-bold text-[#20B2AA] tabular-nums tracking-tight">
            ${totalUsd.toFixed(2)}
          </h2>
          <p className="text-[10px] text-[#8B949E] mt-0.5">
            USDC & MATIC ON-CHAIN TREASURY
          </p>
        </div>

        {/* Quick Mobile Action Bar: Deposit & Withdraw */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1B2026]">
          {depositAddress && (
            <button
              onClick={() => setDepositOpen(true)}
              className="py-2 bg-[#20B2AA] text-[#0F1215] font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 rounded-xs shadow-sm hover:bg-[#20B2AA]/90 cursor-pointer active:scale-95 transition-all"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>DEPOSIT FUNDS</span>
            </button>
          )}

          <a
            href="https://polymarket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 bg-[#16191E] border border-[#20B2AA]/40 text-[#20B2AA] font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 rounded-xs hover:bg-[#20B2AA]/10 cursor-pointer active:scale-95 transition-all"
          >
            <span>WITHDRAW</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Asset Breakdown 2-Column Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-[#0F1215] border border-[#1B2026] rounded-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#586069] uppercase">
            <DollarSign className="h-3 w-3 text-[#20B2AA]" />
            <span>USDC BALANCE</span>
          </div>
          <p className="text-sm font-bold text-[#E1E4E8] tabular-nums">
            {formatNumber(balances?.usdc || 0, 2)}
          </p>
          <p className="text-[9px] text-[#8B949E] tabular-nums">
            ≈ {formatCurrency(balances?.usdc || 0)}
          </p>
        </div>

        <div className="p-3 bg-[#0F1215] border border-[#1B2026] rounded-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#586069] uppercase">
            <Wallet className="h-3 w-3 text-[#20B2AA]" />
            <span>MATIC GAS</span>
          </div>
          <p className="text-sm font-bold text-[#E1E4E8] tabular-nums">
            {formatNumber(balances?.matic || 0, 2)}
          </p>
          <p className="text-[9px] text-[#8B949E] tabular-nums">
            ≈ {formatCurrency((balances?.matic || 0) * 0.8)}
          </p>
        </div>
      </div>

      {/* Daily PnL Calendar */}
      <CalendarPnl trades={trades} />

      {/* Collapsible PnL Chart */}
      <MobileCollapsibleChart trades={trades} allTimePnL={allTimePnL} />

      {/* Transaction Ledger */}
      <TransactionHistory transactions={transactions} loading={loading} />

      {/* Deposit Bottom Sheet Modal */}
      {depositAddress && (
        <MobileBottomSheet
          isOpen={depositOpen}
          onClose={() => setDepositOpen(false)}
          title="DEPOSIT FUNDS (POLYMARKET SETTLEMENT)"
          subtitle="POLYGON NETWORK DEPOSIT ADDRESS"
        >
          <DepositAddress address={depositAddress} walletType={walletType} />
        </MobileBottomSheet>
      )}
    </div>
  );
}
