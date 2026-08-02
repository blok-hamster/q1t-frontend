'use client';

import { useState } from 'react';
import { formatCurrency, formatDate, formatAddress } from '@/lib/utils/format';
import { ArrowDownCircle, ArrowUpCircle, ExternalLink, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type TransactionType = 'deposit' | 'withdrawal' | 'trade_win' | 'trade_loss';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  asset: string;
  status: TransactionStatus;
  txHash?: string;
  address?: string;
  timestamp: string;
  market?: string;
  direction?: string;
  pnl?: number;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading?: boolean;
}

export function TransactionHistory({ transactions, loading = false }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'trades'>('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'deposit') return tx.type === 'deposit';
    if (filter === 'trades') return tx.type === 'trade_win' || tx.type === 'trade_loss' || tx.pnl !== undefined;
    return true;
  });

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] select-none font-mono text-xs">
      {/* Header & Filter Tabs */}
      <div className="p-3.5 border-b border-[#1B2026] flex flex-wrap items-center justify-between gap-3 bg-[#16191E]">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[#20B2AA]" />
          <h3 className="text-xs font-bold text-[#E1E4E8] uppercase tracking-wider">
            TRANSACTION & SETTLEMENT LEDGER
          </h3>
        </div>

        <div className="flex items-center bg-[#080A0C] border border-[#1B2026] p-0.5 text-[10px]">
          {(['all', 'deposit', 'trades'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 uppercase font-bold transition-colors cursor-pointer rounded-xs',
                filter === f
                  ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/30'
                  : 'text-[#8B949E] hover:text-[#E1E4E8]'
              )}
            >
              {f === 'all' ? 'ALL LEDGER' : f === 'deposit' ? 'DEPOSITS' : 'TRADES'}
            </button>
          ))}
        </div>
      </div>

      {/* Body List */}
      <div className="p-3.5 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-[#16191E] border border-[#1B2026] animate-pulse" />
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const isWin = tx.type === 'trade_win' || (tx.pnl && tx.pnl > 0);
              const isLoss = tx.type === 'trade_loss' || (tx.pnl && tx.pnl < 0);
              const isDeposit = tx.type === 'deposit';

              return (
                <div
                  key={tx.id}
                  className="flex flex-wrap items-center justify-between p-3 bg-[#080A0C] border border-[#1B2026] hover:border-[#2A313A] transition-colors gap-3 rounded-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-xs border',
                        isWin && 'bg-[#20B2AA]/10 border-[#20B2AA]/30 text-[#20B2AA]',
                        isLoss && 'bg-[#E55353]/10 border-[#E55353]/30 text-[#E55353]',
                        isDeposit && 'bg-[#D99B00]/10 border-[#D99B00]/30 text-[#D99B00]'
                      )}
                    >
                      {isDeposit ? (
                        <ArrowDownCircle className="h-4 w-4" />
                      ) : isWin ? (
                        <ArrowUpCircle className="h-4 w-4" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#E1E4E8] uppercase">
                          {isDeposit
                            ? 'POLYMARKET DEPOSIT'
                            : `${tx.market || 'POLYMARKET'} (${tx.direction || 'TRADE'})`}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] font-bold uppercase px-1.5 py-0.2 border rounded-xs',
                            tx.status === 'confirmed'
                              ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                              : 'bg-[#D99B00]/15 text-[#D99B00] border-[#D99B00]/30'
                          )}
                        >
                          {tx.status === 'confirmed' ? 'SETTLED' : 'PENDING'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#586069] mt-0.5">
                        {formatDate(tx.timestamp)}
                        {tx.address && ` • ${formatAddress(tx.address)}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        'font-bold text-sm tabular-nums',
                        isWin && 'text-[#20B2AA]',
                        isLoss && 'text-[#E55353]',
                        isDeposit && 'text-[#E1E4E8]'
                      )}
                    >
                      {isWin && '+'}
                      {formatCurrency(tx.pnl !== undefined ? tx.pnl : tx.amount)}
                    </p>
                    {tx.txHash && (
                      <a
                        href={`https://polygonscan.com/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-[#20B2AA] hover:underline mt-0.5"
                      >
                        Polygonscan <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-[#586069]">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold uppercase">NO TRANSACTION HISTORY AVAILABLE</p>
            <p className="text-[10px] mt-1 text-[#8B949E]">
              Settlement trades and deposits will populate here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
