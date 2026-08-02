'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { portfolioApi, dashboardApi } from '@/lib/api';
import { BalanceCard } from '@/components/portfolio/balance-card';
import { DepositAddress } from '@/components/portfolio/deposit-address';
import { WithdrawForm } from '@/components/portfolio/withdraw-form';
import { TransactionHistory } from '@/components/portfolio/transaction-history';
import type { Transaction } from '@/components/portfolio/transaction-history';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import type { Balance } from '@/types/api';
import { Wallet, DollarSign, Shield } from 'lucide-react';

export default function PortfolioPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Balance | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'eoa' | 'proxy'>('eoa');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceData, addressData] = await Promise.all([
          portfolioApi.getBalances(),
          portfolioApi.getDepositAddress(),
        ]);

        setBalances(balanceData);
        setDepositAddress(addressData.address);
        if (addressData.wallet_type) {
          setWalletType(addressData.wallet_type);
        }

        try {
          const transactionData = await dashboardApi.getTransactions(1, 50);
          const transformedTransactions: Transaction[] = transactionData.transactions.map(tx => ({
            id: tx.id,
            type: tx.type.startsWith('trade') ? 'deposit' as const : tx.type as 'deposit' | 'withdrawal',
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
    return <Loading text="Loading portfolio ledger..." />;
  }

  const totalUsd = balances?.totalUsd || 0;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto px-4 py-4">
      {/* Meridian Balance Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
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
            <Shield className="h-3.5 w-3.5 text-[#20B2AA]" />
          </div>
          <p className="text-2xl font-bold text-[#20B2AA] tabular-nums">
            ${totalUsd.toFixed(2)}
          </p>
          <div className="w-full bg-[#16191E] h-1.5 rounded-xs overflow-hidden">
            <div className="bg-[#20B2AA] h-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Deposit & Withdraw Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {depositAddress && <DepositAddress address={depositAddress} walletType={walletType} />}
        <WithdrawForm
          availableBalance={balances?.usdc || 0}
          requires2FA={user?.twoFactorEnabled}
        />
      </div>

      {/* Transaction Ledger History */}
      <TransactionHistory transactions={transactions} loading={loading} />
    </div>
  );
}
