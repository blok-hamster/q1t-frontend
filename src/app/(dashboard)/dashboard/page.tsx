'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSocket } from '@/context/socket-context';
import { executionApi, dashboardApi } from '@/lib/api';
import { ActivePositionsTable } from '@/components/dashboard/active-positions-table';
import { MetricCard } from '@/components/dashboard/metric-card';
import { MobileMetricCarousel } from '@/components/dashboard/mobile-metric-carousel';
import { MobileTradeCard } from '@/components/trades/mobile-trade-card';
import { ROUTES } from '@/lib/constants';
import { formatTimeAgo, formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { ExecutionUpdate } from '@/types/websocket';
import type { Trade } from '@/types/trade';
import { Wallet, TrendingUp, BarChart3, Award, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

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
    socket.on('mid_market_tp_hit', refetchRecent);
    socket.on('mid_market_resolved', refetchRecent);

    return () => {
      socket.off('chart_update', chartHandler);
      socket.off('execution_update', executionHandler);
      socket.off('paper_balance_update', balanceHandler);
      socket.off('mid_market_entry', refetchRecent);
      socket.off('mid_market_stop', refetchRecent);
      socket.off('mid_market_tp_hit', refetchRecent);
      socket.off('mid_market_resolved', refetchRecent);
    };
  }, [socket]);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto px-3 sm:px-4 py-4">
      {/* Mobile Metric Carousel View (< sm screens) */}
      <MobileMetricCarousel metrics={metrics} loading={loadingMetrics} />

      {/* Desktop Metrics Grid (>= sm screens) */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-3">
        <MetricCard
          title="TOTAL BALANCE"
          value={`$${metrics.balance.toFixed(2)}`}
          change={metrics.balanceChange}
          changeLabel="VS YESTERDAY"
          icon={Wallet}
          loading={loadingMetrics}
        />
        <MetricCard
          title="OPEN POSITIONS"
          value={metrics.openTrades}
          icon={TrendingUp}
          loading={loadingMetrics}
        />
        <MetricCard
          title="24H P&L"
          value={`$${metrics.pnl24h.toFixed(2)}`}
          change={metrics.pnl24hChange}
          trend={metrics.pnl24h >= 0 ? 'up' : 'down'}
          icon={BarChart3}
          loading={loadingMetrics}
        />
        <MetricCard
          title="FILTER WIN RATE"
          value={`${metrics.winRate}%`}
          change={metrics.winRateChange}
          trend={metrics.winRateChange >= 0 ? 'up' : 'down'}
          icon={Award}
          loading={loadingMetrics}
        />
      </div>

      {/* Active Positions Table */}
      <ActivePositionsTable />

      {/* Recent Transactions Section */}
      <div className="bg-[#0F1215] border border-[#1B2026]">
        <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]/60">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#586069]">
              RECENT TRANSACTIONS
            </p>
            <h3 className="text-xs font-mono font-bold text-[#E1E4E8] mt-0.5">
              EXECUTED TRADES & RESOLUTIONS
            </h3>
          </div>
          <Link
            href={ROUTES.TRADES}
            className="text-xs font-mono text-[#20B2AA] hover:underline flex items-center gap-1 font-bold"
          >
            VIEW ALL <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loadingTrades ? (
          <div className="p-4 text-center font-mono text-xs text-[#586069]">
            Loading transaction ledger...
          </div>
        ) : recentTrades.length > 0 ? (
          <div>
            {/* Mobile Touch Cards (< sm) */}
            <div className="sm:hidden p-3 space-y-2">
              {recentTrades.map((trade) => (
                <MobileTradeCard key={trade._id} trade={trade} />
              ))}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[#16191E] border-b border-[#1B2026] text-[10px] text-[#586069] uppercase tracking-[0.1em]">
                    <th className="px-3 py-2">DATE / TIME</th>
                    <th className="px-3 py-2">MARKET</th>
                    <th className="px-3 py-2">DIRECTION</th>
                    <th className="px-3 py-2 text-right">SIZE (USD)</th>
                    <th className="px-3 py-2 text-right">P&L AMOUNT</th>
                    <th className="px-3 py-2 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2026]/60">
                  {recentTrades.map((trade) => {
                    const isWin = trade.status === 'CLOSED_WIN';
                    const isLoss = trade.status === 'CLOSED_LOSS';
                    const isOpen = trade.status === 'OPEN';
                    const pnl = trade.pnl || 0;

                    return (
                      <tr key={trade._id} className="hover:bg-[#16191E]/40 transition-colors">
                        <td className="px-3 py-2 text-[#8B949E]">
                          {formatTimeAgo(trade.createdAt)}
                        </td>
                        <td className="px-3 py-2 text-[#E1E4E8] font-bold">
                          {trade.market_slug.toUpperCase()}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 font-bold ${
                            trade.direction === 'UP' ? 'text-[#20B2AA]' : 'text-[#E55353]'
                          }`}>
                            {trade.direction === 'UP' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {trade.direction}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-[#8B949E]">
                          {formatCurrency(trade.size_usd)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold">
                          {isOpen ? (
                            <span className="text-[#586069]">—</span>
                          ) : (
                            <span className={isWin ? 'text-[#20B2AA]' : isLoss ? 'text-[#E55353]' : 'text-[#8B949E]'}>
                              {pnl > 0 ? '+' : ''}
                              {formatCurrency(pnl)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-xs border ${
                            isWin
                              ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                              : isLoss
                              ? 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30'
                              : isOpen
                              ? 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/20'
                              : 'bg-[#D99B00]/15 text-[#D99B00] border-[#D99B00]/30'
                          }`}>
                            {isOpen ? 'OPEN' : isWin ? 'SETTLED WIN' : isLoss ? 'SETTLED LOSS' : trade.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 font-mono">
            <BarChart3 className="h-8 w-8 text-[#586069] mx-auto mb-2" />
            <p className="text-xs text-[#8B949E]">No transactions recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
