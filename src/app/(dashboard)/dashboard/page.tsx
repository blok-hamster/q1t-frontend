'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSocket } from '@/context/socket-context';
import { executionApi, dashboardApi } from '@/lib/api';
import { ActivePositionsTable } from '@/components/dashboard/active-positions-table';
import { PriceTicker } from '@/components/dashboard/price-ticker';
import { MetricCard } from '@/components/dashboard/metric-card';
import { ConnectionStatus } from '@/components/dashboard/connection-status';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants';
import { formatTimeAgo, formatCurrency } from '@/lib/utils/format';
import type { ExecutionUpdate } from '@/types/websocket';
import type { Trade } from '@/types/trade';
import { Wallet, TrendingUp, BarChart3, Award, ArrowUp, ArrowDown } from 'lucide-react';

export default function DashboardPage() {
  const { socket } = useSocket();
  const [currentPrice, setCurrentPrice] = useState(69420);
  const [price24hChange, setPrice24hChange] = useState<number | undefined>(undefined);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  const [metrics, setMetrics] = useState({
    balance: 0,
    balanceChange: 0,
    openTrades: 0,
    pnl24h: 0,
    pnl24hChange: 0,
    winRate: 0,
    winRateChange: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const metricsData = await dashboardApi.getMetrics();
        setMetrics({
          balance: metricsData.balance,
          balanceChange: metricsData.balanceChange,
          openTrades: metricsData.openTrades,
          pnl24h: metricsData.pnl24h,
          pnl24hChange: metricsData.pnl24hChange,
          winRate: metricsData.winRate,
          winRateChange: metricsData.winRateChange,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setLoadingMetrics(false);
      }

      try {
        const { trades } = await executionApi.getTrades();
        const sorted = trades.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentTrades(sorted.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch trades:', error);
      } finally {
        setLoadingTrades(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Price updates from chart channel (if available)
    const chartHandler = (candle: any) => {
      if (candle.close) setCurrentPrice(candle.close);
    };

    const executionHandler = (update: ExecutionUpdate) => {
      setRecentTrades((prev) =>
        prev.map((trade) =>
          trade._id === update.trade_id
            ? { ...trade, status: update.status }
            : trade
        )
      );

      if (update.status === 'OPEN') {
        executionApi.getTrades().then(({ trades }) => {
          const sorted = trades.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setRecentTrades(sorted.slice(0, 5));
        });
      }
    };

    // Paper balance live updates
    const balanceHandler = (data: { balance: number }) => {
      setMetrics(prev => ({ ...prev, balance: data.balance }));
    };

    const refetchRecent = () => {
      executionApi.getTrades({ limit: 5 }).then(({ trades }) => {
        const sorted = trades.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentTrades(sorted.slice(0, 5));
      }).catch(() => {});
    };

    socket.on('chart_update', chartHandler);
    socket.on('execution_update', executionHandler);
    socket.on('paper_balance_update', balanceHandler);
    socket.on('mid_market_entry', refetchRecent);
    socket.on('mid_market_stop', refetchRecent);
    socket.on('mid_market_resolved', refetchRecent);
    socket.on('scalp_entry', refetchRecent);
    socket.on('scalp_exit', refetchRecent);

    return () => {
      socket.off('chart_update', chartHandler);
      socket.off('execution_update', executionHandler);
      socket.off('paper_balance_update', balanceHandler);
      socket.off('mid_market_entry', refetchRecent);
      socket.off('mid_market_stop', refetchRecent);
      socket.off('mid_market_resolved', refetchRecent);
      socket.off('scalp_entry', refetchRecent);
      socket.off('scalp_exit', refetchRecent);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor your trading performance
          </p>
        </div>
        <ConnectionStatus showLabel />
      </div>

      {/* Price Ticker */}
      <PriceTicker price={currentPrice} change24h={price24hChange} />

      {/* Active Positions Table (full-width, grouped by strategy) */}
      <ActivePositionsTable />

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loadingMetrics ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-bg-tertiary rounded-lg animate-pulse" />
            ))}
          </>
        ) : (
          <>
            <MetricCard
              title="Balance"
              value={`$${metrics.balance.toFixed(2)}`}
              change={metrics.balanceChange}
              changeLabel="vs yesterday"
              icon={Wallet}
            />
            <MetricCard
              title="Open Trades"
              value={metrics.openTrades}
              icon={TrendingUp}
            />
            <MetricCard
              title="24h P&L"
              value={`$${metrics.pnl24h.toFixed(2)}`}
              change={metrics.pnl24hChange}
              trend={metrics.pnl24h >= 0 ? 'up' : 'down'}
              icon={BarChart3}
            />
            <MetricCard
              title="Win Rate"
              value={`${metrics.winRate}%`}
              change={metrics.winRateChange}
              trend={metrics.winRateChange >= 0 ? 'up' : 'down'}
              icon={Award}
            />
          </>
        )}
      </div>

      {/* Recent Trades Preview */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Recent Trades
          </h3>
          <Link
            href={ROUTES.TRADES}
            className="text-sm text-accent-primary hover:text-accent-hover transition-colors"
          >
            View All →
          </Link>
        </div>

        {loadingTrades ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-bg-tertiary rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : recentTrades.length > 0 ? (
          <div className="space-y-3">
            {recentTrades.map((trade) => {
              const isWin = trade.status === 'CLOSED_WIN';
              const isLoss = trade.status === 'CLOSED_LOSS';
              const isOpen = trade.status === 'OPEN';
              const pnl = trade.pnl || 0;

              return (
                <div
                  key={trade._id}
                  className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        trade.direction === 'UP'
                          ? 'bg-positive/20'
                          : 'bg-negative/20'
                      }`}
                    >
                      {trade.direction === 'UP' ? (
                        <ArrowUp className="h-4 w-4 text-positive" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-negative" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {trade.market_slug}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {formatTimeAgo(trade.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isOpen ? (
                      <>
                        <Badge variant="info" size="sm">
                          Open
                        </Badge>
                        <p className="text-xs text-text-tertiary mt-1">
                          {formatCurrency(trade.size_usd)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p
                          className={`text-sm font-mono font-semibold ${
                            isWin
                              ? 'text-positive'
                              : isLoss
                                ? 'text-negative'
                                : 'text-text-secondary'
                          }`}
                        >
                          {pnl > 0 ? '+' : ''}
                          {formatCurrency(pnl)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {isWin ? 'Win' : isLoss ? 'Loss' : trade.status}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No trades yet</p>
            <p className="text-xs text-text-tertiary mt-1">
              Trades will appear here when positions are opened
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
