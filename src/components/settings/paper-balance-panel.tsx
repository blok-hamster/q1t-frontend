'use client';

import { useState } from 'react';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { DollarSign, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface Props {
  initialBalance: number;
  onUpdate: (balance: number) => void;
}

export function PaperBalancePanel({ initialBalance, onUpdate }: Props) {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [inputVal, setInputVal] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSetBalance = async (newVal: number) => {
    if (isNaN(newVal) || newVal < 0) {
      toast.error('Enter a valid positive balance');
      return;
    }

    setLoading(true);
    try {
      await settingsApi.updatePaperBalance(newVal);
      setBalance(newVal);
      onUpdate(newVal);
      setInputVal('');
      toast.success(`Paper balance updated to ${formatCurrency(newVal)}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update paper balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] select-none font-mono">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]/60">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[#20B2AA]" />
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069] block">
              SIMULATION ACCOUNT
            </span>
            <h3 className="font-mono text-xs font-bold text-[#E1E4E8] mt-0.5 uppercase">
              PAPER TRADING BALANCE
            </h3>
          </div>
        </div>
        <span className="font-mono text-xs font-bold text-[#20B2AA] tabular-nums bg-[#20B2AA]/10 border border-[#20B2AA]/30 px-2 py-0.5 rounded-xs">
          {formatCurrency(balance)} USDC
        </span>
      </div>

      <div className="p-4 space-y-4 font-mono text-xs">
        <p className="text-[#8B949E] text-xs">
          Set virtual capital for dry-run simulation trades. DRY RUN mode uses this virtual balance.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Custom balance..."
            className="px-3 py-1.5 bg-[#080A0C] border border-[#1B2026] text-[#E1E4E8] font-mono text-xs focus:border-[#20B2AA] focus:outline-none w-44 rounded-xs"
          />
          <button
            onClick={() => handleSetBalance(parseFloat(inputVal))}
            disabled={loading || !inputVal}
            className="px-3.5 py-1.5 bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/30 font-bold uppercase hover:bg-[#20B2AA]/20 transition-colors disabled:opacity-40 cursor-pointer rounded-xs"
          >
            Update Balance
          </button>
          <button
            onClick={() => handleSetBalance(1000)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-[#16191E] text-[#8B949E] border border-[#1B2026] font-bold uppercase hover:text-[#E1E4E8] hover:border-[#2A313A] transition-colors flex items-center gap-1.5 cursor-pointer rounded-xs"
          >
            <RotateCcw className="h-3 w-3" /> Reset $1,000
          </button>
        </div>
      </div>
    </div>
  );
}
