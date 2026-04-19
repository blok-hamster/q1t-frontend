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
import { Wallet, DollarSign } from 'lucide-react';

export default function PortfolioPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Balance | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'eoa' | 'proxy'>('eoa');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Fetch balances and transactions
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

        // Fetch real transaction history
        try {
          const transactionData = await dashboardApi.getTransactions(1, 50);

          // Transform API transactions to match TransactionHistory component format
          const transformedTransactions: Transaction[] = transactionData.transactions.map(tx => ({
            id: tx.id,
            type: tx.type.startsWith('trade') ? 'deposit' as const : tx.type as 'deposit' | 'withdrawal',
            amount: tx.amount,
            asset: 'USDC', // Default to USDC for now
            status: tx.status === 'completed' ? 'confirmed' : tx.status === 'pending' ? 'pending' : 'failed',
            timestamp: tx.timestamp,
            // Optional fields for trade types
            ...(tx.market && { market: tx.market }),
            ...(tx.direction && { direction: tx.direction }),
            ...(tx.pnl !== undefined && { pnl: tx.pnl }),
          }));

          setTransactions(transformedTransactions);
          console.log('✅ Loaded transaction history:', transformedTransactions.length, 'transactions');
        } catch (txError) {
          console.error('Failed to load transaction history:', txError);
          // Keep transactions empty array if API fails
        }
      } catch (error) {
        toast.error('Failed to load portfolio data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll balances every 30 seconds
    const interval = setInterval(() => {
      portfolioApi.getBalances().then(setBalances).catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Loading text="Loading portfolio..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Portfolio</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your wallet and funds
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BalanceCard
          asset="MATIC"
          balance={balances?.matic || 0}
          usdValue={(balances?.matic || 0) * 0.8} // Mock price
          icon={Wallet}
        />

        <BalanceCard
          asset="USDC"
          balance={balances?.usdc || 0}
          usdValue={balances?.usdc || 0}
          icon={DollarSign}
        />

        <div className="md:col-span-2 lg:col-span-1">
          <div className="h-full p-6 bg-gradient-to-br from-accent-primary/20 to-positive/20 rounded-lg border border-accent-primary/30">
            <div className="space-y-2">
              <h3 className="text-sm text-text-tertiary uppercase tracking-wide">
                Total Portfolio Value
              </h3>
              <p className="text-4xl font-bold font-mono text-text-primary">
                ${(balances?.totalUsd || 0).toFixed(2)}
              </p>
              <p className="text-xs text-text-secondary">
                Updated just now
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit & Withdraw */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Address */}
        {depositAddress && <DepositAddress address={depositAddress} walletType={walletType} />}

        {/* Withdraw Form */}
        <WithdrawForm
          availableBalance={balances?.usdc || 0}
          requires2FA={user?.twoFactorEnabled}
        />
      </div>

      {/* Transaction History */}
      <TransactionHistory transactions={transactions} loading={loading} />
    </div>
  );
}
