'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSocket } from '@/context/socket-context';
import { executionApi } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TradeRow } from '@/components/trades/trade-row';
import { MobileTradeCard } from '@/components/trades/mobile-trade-card';
import { MobileFilterSheet } from '@/components/trades/mobile-filter-sheet';
import { Loading } from '@/components/ui/loading';
import type { Trade, TradeStatus, TradeDirection, TradeStrategy } from '@/types/trade';
import type { ExecutionUpdate } from '@/types/websocket';
import {
  BarChart3,
  TrendingUp,
  Award,
  DollarSign,
  Search,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';

export default function TradesPage() {
  const { socket } = useSocket();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TradeStatus | 'all'>('all');
  const [directionFilter, setDirectionFilter] = useState<TradeDirection | 'all'>('all');
  const [strategyFilter, setStrategyFilter] = useState<TradeStrategy | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchTrades = useCallback(async (cursor?: string) => {
    try {
      const result = await executionApi.getTrades({ cursor, limit: 50 });
      if (cursor) {
        setTrades(prev => [...prev, ...result.trades]);
      } else {
        setTrades(result.trades);
      }
      setHasMore(result.hasMore ?? false);
      setNextCursor(result.nextCursor ?? null);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
  }, []);

  useEffect(() => {
    fetchTrades().finally(() => setLoading(false));
  }, [fetchTrades]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchTrades(nextCursor);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('execution_update', (update: ExecutionUpdate) => {
      setTrades((prev) =>
        prev.map((trade) =>
          trade._id === update.trade_id
            ? { ...trade, status: update.status }
            : trade
        )
      );
    });

    const refetchOnEvent = () => {
      fetchTrades();
    };
    socket.on('mid_market_entry', refetchOnEvent);
    socket.on('mid_market_stop', refetchOnEvent);
    socket.on('mid_market_resolved', refetchOnEvent);

    return () => {
      socket.off('execution_update');
      socket.off('mid_market_entry', refetchOnEvent);
      socket.off('mid_market_stop', refetchOnEvent);
      socket.off('mid_market_resolved', refetchOnEvent);
    };
  }, [socket, fetchTrades]);

  const stats = useMemo(() => {
    const closedTrades = trades.filter(
      (t) => t.status === 'CLOSED_WIN' || t.status === 'CLOSED_LOSS'
    );
    const winningTrades = trades.filter((t) => t.status === 'CLOSED_WIN');
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    return {
      totalTrades: trades.length,
      openTrades: trades.filter((t) => t.status === 'OPEN').length,
      winRate: closedTrades.length > 0
        ? (winningTrades.length / closedTrades.length) * 100
        : 0,
      totalPnL,
    };
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      if (statusFilter !== 'all' && trade.status !== statusFilter) {
        return false;
      }
      if (directionFilter !== 'all' && trade.direction !== directionFilter) {
        return false;
      }
      if (strategyFilter !== 'all' && (trade.strategy || 'mid_market') !== strategyFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          trade.market_slug.toLowerCase().includes(query) ||
          trade._id.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [trades, statusFilter, directionFilter, strategyFilter, searchQuery]);

  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <Loading text="Loading transaction ledger..." />;
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto px-3 sm:px-4 py-4">
      {/* Top Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="TOTAL EXECUTIONS"
          value={stats.totalTrades}
          icon={BarChart3}
        />
        <MetricCard
          title="OPEN POSITIONS"
          value={stats.openTrades}
          icon={TrendingUp}
        />
        <MetricCard
          title="FILTER WIN RATE"
          value={`${stats.winRate.toFixed(1)}%`}
          icon={Award}
        />
        <MetricCard
          title="ACCUMULATED P&L"
          value={`$${stats.totalPnL.toFixed(2)}`}
          trend={stats.totalPnL > 0 ? 'up' : stats.totalPnL < 0 ? 'down' : 'neutral'}
          icon={DollarSign}
        />
      </div>

      {/* Mobile Filter Sheet & Search Bar (< sm) */}
      <MobileFilterSheet
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(s) => { setStatusFilter(s); setCurrentPage(1); }}
        directionFilter={directionFilter}
        onDirectionChange={(d) => { setDirectionFilter(d); setCurrentPage(1); }}
        totalResults={filteredTrades.length}
      />

      {/* Desktop Filter Control Bar (>= sm) */}
      <div className="hidden sm:block bg-[#0F1215] border border-[#1B2026] p-3 space-y-3 font-mono">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#586069]" />
          <input
            type="text"
            placeholder="Search transaction ledger by market or trade ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#16191E] border border-[#1B2026] text-xs text-[#E1E4E8] placeholder:text-[#586069] focus:border-[#20B2AA] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-[#586069]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase font-bold">FILTERS:</span>
          </div>

          <div className="flex items-center gap-1.5 max-w-full">
            <span className="text-[10px] text-[#586069] uppercase font-bold shrink-0">STATUS:</span>
            <div className="flex gap-1 overflow-x-auto scrollbar-none max-w-full py-0.5">
              {(['all', 'OPEN', 'CLOSED_WIN', 'CLOSED_LOSS'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs transition-colors border shrink-0 ${
                    statusFilter === status
                      ? 'bg-[#20B2AA]/20 text-[#20B2AA] border-[#20B2AA]/40'
                      : 'bg-[#16191E] text-[#8B949E] border-[#1B2026] hover:text-[#E1E4E8]'
                  }`}
                >
                  {status === 'all' ? 'ALL' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 max-w-full">
            <span className="text-[10px] text-[#586069] uppercase font-bold shrink-0">DIRECTION:</span>
            <div className="flex gap-1 overflow-x-auto scrollbar-none max-w-full py-0.5">
              {(['all', 'UP', 'DOWN'] as const).map((direction) => (
                <button
                  key={direction}
                  onClick={() => { setDirectionFilter(direction); setCurrentPage(1); }}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs transition-colors border shrink-0 ${
                    directionFilter === direction
                      ? 'bg-[#20B2AA]/20 text-[#20B2AA] border-[#20B2AA]/40'
                      : 'bg-[#16191E] text-[#8B949E] border-[#1B2026] hover:text-[#E1E4E8]'
                  }`}
                >
                  {direction === 'all' ? 'ALL' : direction}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto text-[10px] text-[#586069] uppercase">
            SHOWING {filteredTrades.length} RECORDED TRANSACTIONS
          </div>
        </div>
      </div>

      {/* Main Ledger Table / Mobile Cards */}
      {filteredTrades.length > 0 ? (
        <div className="bg-[#0F1215] border border-[#1B2026]">
          {/* Mobile Card List (< sm) */}
          <div className="sm:hidden p-3 space-y-2">
            {paginatedTrades.map((trade) => (
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
                  <th className="px-3 py-2 text-right">ENTRY PRICE</th>
                  <th className="px-3 py-2 text-right">STATUS</th>
                  <th className="px-3 py-2 text-right">P&L AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2026]/60">
                {paginatedTrades.map((trade) => (
                  <TradeRow key={trade._id} trade={trade} variant="desktop" />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-[#1B2026] bg-[#16191E]/30 font-mono text-xs">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#16191E] border border-[#1B2026] text-[#8B949E] hover:text-[#E1E4E8] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                PREVIOUS
              </button>

              <span className="text-[11px] text-[#586069]">
                PAGE {currentPage} OF {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-[#16191E] border border-[#1B2026] text-[#8B949E] hover:text-[#E1E4E8] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                NEXT
              </button>
            </div>
          )}

          {hasMore && (
            <div className="p-3 border-t border-[#1B2026] text-center bg-[#16191E]/20 font-mono">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-1.5 text-xs text-[#20B2AA] bg-[#20B2AA]/10 border border-[#20B2AA]/30 hover:bg-[#20B2AA]/20 transition-colors inline-flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    FETCHING LEDGER...
                  </>
                ) : (
                  'FETCH MORE TRANSACTIONS'
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0F1215] border border-[#1B2026] text-center py-12 font-mono">
          <BarChart3 className="h-10 w-10 text-[#586069] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#E1E4E8]">NO TRANSACTIONS MATCH FILTERS</h3>
          <p className="text-xs text-[#586069] mt-1">Try resetting search parameters</p>
        </div>
      )}
    </div>
  );
}
