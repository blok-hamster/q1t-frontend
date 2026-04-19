'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSocket } from '@/context/socket-context';
import { executionApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TradeRow } from '@/components/trades/trade-row';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import type { Trade, TradeStatus, TradeDirection } from '@/types/trade';
import type { ExecutionUpdate } from '@/types/websocket';
import {
  BarChart3,
  TrendingUp,
  Award,
  DollarSign,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

export default function TradesPage() {
  const { socket } = useSocket();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TradeStatus | 'all'>('all');
  const [directionFilter, setDirectionFilter] = useState<TradeDirection | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch trades on mount
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const { trades: fetchedTrades } = await executionApi.getTrades();
        setTrades(fetchedTrades);
      } catch (error) {
        console.error('Failed to fetch trades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

  // Listen for trade updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    socket.on('execution_update', (update: ExecutionUpdate) => {
      console.log('💼 Trade Update:', update);
      setTrades((prev) =>
        prev.map((trade) =>
          trade._id === update.trade_id
            ? { ...trade, status: update.status }
            : trade
        )
      );
    });

    return () => {
      socket.off('execution_update');
    };
  }, [socket]);

  // Calculate stats
  const stats = useMemo(() => {
    const closedTrades = trades.filter(
      (t) => t.status === 'CLOSED_WIN' || t.status === 'CLOSED_LOSS'
    );
    const winningTrades = trades.filter((t) => t.status === 'CLOSED_WIN');
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
        : 0;

    return {
      totalTrades: trades.length,
      openTrades: trades.filter((t) => t.status === 'OPEN').length,
      winRate: closedTrades.length > 0
        ? (winningTrades.length / closedTrades.length) * 100
        : 0,
      totalPnL,
      avgWin,
    };
  }, [trades]);

  // Filter and search trades
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Status filter
      if (statusFilter !== 'all' && trade.status !== statusFilter) {
        return false;
      }

      // Direction filter
      if (directionFilter !== 'all' && trade.direction !== directionFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          trade.market_slug.toLowerCase().includes(query) ||
          trade._id.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [trades, statusFilter, directionFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <Loading text="Loading trades..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Trade History</h1>
        <p className="text-sm text-text-secondary mt-1">
          View all your past and active trades
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Trades"
          value={stats.totalTrades}
          icon={BarChart3}
        />
        <MetricCard
          title="Open Trades"
          value={stats.openTrades}
          icon={TrendingUp}
        />
        <MetricCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          icon={Award}
        />
        <MetricCard
          title="Total P&L"
          value={`$${stats.totalPnL.toFixed(2)}`}
          trend={stats.totalPnL > 0 ? 'up' : stats.totalPnL < 0 ? 'down' : 'neutral'}
          icon={DollarSign}
        />
      </div>

      {/* Filters */}
      <Card padding="lg">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by market or trade ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm text-text-secondary">Filters:</span>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">Status:</span>
              <div className="flex gap-1">
                {(['all', 'OPEN', 'CLOSED_WIN', 'CLOSED_LOSS', 'PENDING'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      statusFilter === status
                        ? 'bg-accent-primary text-bg-primary'
                        : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Direction filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">Direction:</span>
              <div className="flex gap-1">
                {(['all', 'UP', 'DOWN'] as const).map((direction) => (
                  <button
                    key={direction}
                    onClick={() => setDirectionFilter(direction)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      directionFilter === direction
                        ? 'bg-accent-primary text-bg-primary'
                        : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {direction === 'all' ? 'All' : direction}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div className="ml-auto text-sm text-text-tertiary">
              {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'}
            </div>
          </div>
        </div>
      </Card>

      {/* Trade Table/List */}
      {filteredTrades.length > 0 ? (
        <Card padding="lg">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase">
                    Date/Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase">
                    Market
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase">
                    Direction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase">
                    Entry Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase">
                    P&L
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map((trade) => (
                  <TradeRow key={trade._id} trade={trade} variant="desktop" />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedTrades.map((trade) => (
              <TradeRow key={trade._id} trade={trade} variant="mobile" />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm text-text-primary bg-bg-tertiary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary/80 transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-accent-primary text-bg-primary'
                          : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm text-text-primary bg-bg-tertiary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary/80 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="lg">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No trades found
            </h3>
            <p className="text-text-secondary">
              {searchQuery || statusFilter !== 'all' || directionFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Trades will appear here when the AI places them'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
