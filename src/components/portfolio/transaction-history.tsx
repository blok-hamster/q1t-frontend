'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatAddress } from '@/lib/utils/format';
import { ArrowUpCircle, ArrowDownCircle, ExternalLink, Clock } from 'lucide-react';

/**
 * Transaction types
 */
export type TransactionType = 'deposit' | 'withdrawal';

/**
 * Transaction status
 */
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

/**
 * Transaction interface
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  asset: string;
  status: TransactionStatus;
  txHash?: string;
  address?: string;
  timestamp: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading?: boolean;
}

export function TransactionHistory({
  transactions,
  loading = false,
}: TransactionHistoryProps) {
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((tx) => tx.type === filter);

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="success" size="sm">
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="error" size="sm">
            Failed
          </Badge>
        );
    }
  };

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">
            Transaction History
          </h3>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-accent-primary text-bg-primary'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('deposit')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === 'deposit'
                  ? 'bg-accent-primary text-bg-primary'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setFilter('withdrawal')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === 'withdrawal'
                  ? 'bg-accent-primary text-bg-primary'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              Withdrawals
            </button>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-bg-tertiary rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 transition-colors"
              >
                {/* Left: Icon + Details */}
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-full ${
                      tx.type === 'deposit'
                        ? 'bg-positive/20'
                        : 'bg-accent-primary/20'
                    }`}
                  >
                    {tx.type === 'deposit' ? (
                      <ArrowDownCircle className="h-5 w-5 text-positive" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-accent-primary" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-text-primary capitalize">
                        {tx.type}
                      </p>
                      {getStatusBadge(tx.status)}
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {formatDate(tx.timestamp)}
                    </p>
                    {tx.address && (
                      <p className="text-xs text-text-secondary mt-1">
                        {tx.type === 'deposit' ? 'From: ' : 'To: '}
                        {formatAddress(tx.address)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Amount + Link */}
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold text-text-primary">
                    {tx.type === 'deposit' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-text-tertiary">{tx.asset}</p>

                  {tx.txHash && tx.status === 'confirmed' && (
                    <a
                      href={`https://polygonscan.com/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent-primary hover:text-accent-hover mt-1"
                    >
                      View on Polygonscan
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
              {filter === 'deposit' ? (
                <ArrowDownCircle className="h-8 w-8 text-text-tertiary" />
              ) : filter === 'withdrawal' ? (
                <ArrowUpCircle className="h-8 w-8 text-text-tertiary" />
              ) : (
                <Clock className="h-8 w-8 text-text-tertiary" />
              )}
            </div>
            <p className="text-sm text-text-secondary">
              {filter === 'all'
                ? 'No transactions yet'
                : `No ${filter}s yet`}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              {filter === 'deposit'
                ? 'Deposit funds to start trading'
                : filter === 'withdrawal'
                ? 'Withdraw your profits anytime'
                : 'Your transaction history will appear here'}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
