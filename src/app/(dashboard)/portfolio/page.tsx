'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { portfolioApi, dashboardApi, executionApi } from '@/lib/api';
import { BalanceCard } from '@/components/portfolio/balance-card';
import { DepositAddress } from '@/components/portfolio/deposit-address';
import { PortfolioPnlChart } from '@/components/portfolio/portfolio-pnl-chart';
import { TransactionHistory } from '@/components/portfolio/transaction-history';
import { MobilePortfolioView } from '@/components/portfolio/mobile-portfolio-view';
import type { Transaction } from '@/components/portfolio/transaction-history';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import type { Balance } from '@/types/api';
import type { Trade } from '@/types/trade';
import { Wallet, DollarSign, ShieldCheck, ExternalLink, Zap } from 'lucide-react';

export default function PortfolioPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Balance | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'eoa' | 'proxy'>('eoa');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [allTimePnL, setAllTimePnL] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceData, addressData, portfolioSummary] = await Promise.all([
          portfolioApi.getBalances(),
          portfolioApi.getDepositAddress(),
          dashboardApi.getPortfolioSummary().catch(() => null),
        ]);

        setBalances(balanceData);
        setDepositAddress(addressData.address);
        if (addressData.wallet_type) {
          setWalletType(addressData.wallet_type);
        }
        if (portfolioSummary?.allTimePnL !== undefined) {
          setAllTimePnL(portfolioSummary.allTimePnL);
        }

        // Fetch trade history for PnL trajectory chart & transaction ledger
        try {
          const tradeLedger = await executionApi.getTrades({ limit: 100 });
          if (tradeLedger?.trades) {
            setTrades(tradeLedger.trades);
          }
        } catch (tradeErr) {
          console.warn('Could not load trade ledger for PnL chart:', tradeErr);
        }

        try {
          const transactionData = await dashboardApi.getTransactions(1, 50);
          const transformedTransactions: Transaction[] = transactionData.transactions.map((tx) => ({
            id: tx.id,
            type: tx.type.startsWith('trade')
              ? (tx.pnl && tx.pnl >= 0 ? 'trade_win' : 'trade_loss')
              : (tx.type as 'deposit' | 'withdrawal'),
            amount: tx.amount,
            asset: 'USDC',
            status: tx.status === 'completed' ? 'confirmed' : tx.status === 'pending' ? 'pending' : 'failed',
            timestamp: tx.timestamp,
            ...(tx.market && { market: tx.market }),
            ...(tx.direction && { direction: tx.direction }),
            ...(tx.pnl !== undefined && { pnl: tx.pnl }),
          }));

          setTransactions(transformedTransactions);
        } catch (txError) {
          console.error('Failed to load transaction history:', txError);
        }
      } catch (error) {
        toast.error('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      portfolioApi.getBalances().then(setBalances).catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Loading text="Initializing Portfolio & PnL Engine..." />;
  }

  const totalUsd = balances?.totalUsd || 0;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto px-3 sm:px-4 py-3 select-none font-mono text-xs">
      {/* Dedicated Mobile Portfolio Layout (< md) */}
      <MobilePortfolioView
        balances={balances}
        depositAddress={depositAddress}
        walletType={walletType}
        transactions={transactions}
        trades={trades}
        allTimePnL={allTimePnL}
        loading={loading}
      />

      {/* Desktop Portfolio Layout (>= md) */}
      <div className="hidden md:block space-y-4">
        {/* Top Banner & Polymarket Direct Withdrawal Action */}
        <div className="p-3.5 bg-[#0F1215] border border-[#1B2026] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#20B2AA]" />
            <span className="text-xs font-bold text-[#E1E4E8] uppercase tracking-wider block">
              POLYMARKET TREASURY LEDGER
            </span>
          </div>

          <a
            href="https://polymarket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#16191E] border border-[#20B2AA]/40 text-[#20B2AA] hover:bg-[#20B2AA]/10 transition-colors font-bold uppercase text-[10px] flex items-center gap-1.5 rounded-xs"
          >
            Withdraw on Polymarket <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Balance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BalanceCard
            asset="MATIC (POLYGON GAS)"
            balance={balances?.matic || 0}
            usdValue={(balances?.matic || 0) * 0.8}
            icon={Wallet}
          />

          <BalanceCard
            asset="USDC (POLYMARKET SETTLEMENT)"
            balance={balances?.usdc || 0}
            usdValue={balances?.usdc || 0}
            icon={DollarSign}
          />

          <div className="bg-[#0F1215] border border-[#1B2026] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#586069] uppercase tracking-[0.12em]">
                TOTAL TREASURY VALUE
              </p>
              <Zap className="h-3.5 w-3.5 text-[#20B2AA]" />
            </div>
            <p className="text-xl font-bold text-[#20B2AA] tabular-nums">
              ${totalUsd.toFixed(2)}
            </p>
            <div className="w-full bg-[#16191E] h-1.5 rounded-xs overflow-hidden">
              <div className="bg-[#20B2AA] h-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Real-time PnL Trajectory Chart */}
        <PortfolioPnlChart trades={trades} allTimePnL={allTimePnL} />

        {/* Deposit Address Component */}
        {depositAddress && (
          <DepositAddress address={depositAddress} walletType={walletType} />
        )}

        {/* Transaction & Settlement Ledger */}
        <TransactionHistory transactions={transactions} loading={loading} />
      </div>
    </div>
  );
}
