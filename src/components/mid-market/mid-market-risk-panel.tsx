'use client';

import { Shield, Percent, PieChart, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

export interface MidMarketRiskPanelProps {
  maxBetPct?: number;
  useKelly?: boolean;
  totalBalance?: number;
  activeExposures?: { name: string; amount: number; pct: number }[];
}

export function MidMarketRiskPanel({
  maxBetPct = 0.05,
  useKelly = true,
  totalBalance = 25000,
  activeExposures = [
    { name: 'BTC-5M Mid-Market', amount: 1250, pct: 5.0 },
    { name: 'SOL-5M Mid-Market', amount: 375, pct: 1.5 },
  ],
}: MidMarketRiskPanelProps) {
  const maxBetUsd = totalBalance * maxBetPct;

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]/60">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#20B2AA]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
            RISK & KELLY SIZING
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/30 font-bold">
          {useKelly ? 'KELLY ACTIVE' : 'FIXED BET'}
        </span>
      </div>

      <div className="p-4 space-y-4 font-mono text-xs">
        {/* Max Bet & USD Equiv */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#8B949E]">MAX POSITION SIZING</span>
            <span className="text-[#E1E4E8] font-bold tabular-nums">
              {(maxBetPct * 100).toFixed(1)}% ({formatCurrency(maxBetUsd)})
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-[#16191E] border border-[#1B2026] p-0.5 rounded-xs">
            <div
              className="h-full bg-[#20B2AA] rounded-xs transition-all"
              style={{ width: `${Math.min(maxBetPct * 100 * 2, 100)}%` }}
            />
          </div>
        </div>

        {/* Strategy Exposure List */}
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#586069] mb-2">
            <span>STRATEGY EXPOSURE</span>
            <span>USD EQUIV</span>
          </div>

          <div className="space-y-2">
            {activeExposures.map((exp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-[#16191E]/60 border border-[#1B2026] hover:border-[#2A313A] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#20B2AA]" />
                  <span className="text-[#E1E4E8] font-bold text-[11px]">
                    {exp.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#E1E4E8] font-bold tabular-nums block text-[11px]">
                    {formatCurrency(exp.amount)}
                  </span>
                  <span className="text-[9px] text-[#8B949E] tabular-nums">
                    {exp.pct.toFixed(2)}% ALLOCATED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safeguard Indicators */}
        <div className="pt-3 border-t border-[#1B2026] flex items-center justify-between text-[10px] text-[#8B949E]">
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-[#D99B00]" /> COOLDOWN ON 2 LOSSES
          </span>
          <span className="text-[#20B2AA] font-bold">SL: -$5.00 / TP: +$15.00</span>
        </div>
      </div>
    </div>
  );
}
