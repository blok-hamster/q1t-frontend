'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSocket } from '@/context/socket-context';
import { executionApi, predictionApi, dashboardApi } from '@/lib/api';
import { AISignalCard } from '@/components/dashboard/ai-signal-card';
import { PriceTicker } from '@/components/dashboard/price-ticker';
import { MetricCard } from '@/components/dashboard/metric-card';
import { ConnectionStatus } from '@/components/dashboard/connection-status';
import { CandlestickChart } from '@/components/charts/candlestick-chart';
import { VolumeBars } from '@/components/charts/volume-bars';
import { PredictionHistory } from '@/components/dashboard/prediction-history';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants';
import { formatTimeAgo, formatCurrency } from '@/lib/utils/format';
import type { AISignal, ChartUpdate, ExecutionUpdate } from '@/types/websocket';
import type { Candle, ChartTimeframe } from '@/types/market';
import type { Trade } from '@/types/trade';
import { Wallet, TrendingUp, BarChart3, Award, ArrowUp, ArrowDown } from 'lucide-react';

export default function DashboardPage() {
  const { socket } = useSocket();
  const [currentSignal, setCurrentSignal] = useState<AISignal | null>(null);
  const [currentPrice, setCurrentPrice] = useState(69420);
  const [price24hChange, setPrice24hChange] = useState(2.5);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>('5m');
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  // Real metrics from API
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

  // Fetch current prediction and recent trades on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch current prediction (if any)
      try {
        const data = await predictionApi.getCurrent();
        if (data?.prediction) {
          setCurrentSignal(data.prediction);
          console.log('✅ Loaded current prediction from API:', data.prediction);
        } else {
          console.log('⏳ No active prediction');
        }
      } catch (error) {
        console.error('Failed to fetch current prediction:', error);
      }

      // Fetch dashboard metrics
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
        console.log('✅ Loaded dashboard metrics:', metricsData);
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setLoadingMetrics(false);
      }

      // Fetch recent trades
      try {
        const { trades } = await executionApi.getTrades();
        // Get last 5 trades, sorted by date
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

  // Setup WebSocket listeners
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ No socket available');
      return;
    }

    console.log('✅ Setting up WebSocket listeners...');

    // AI Signal updates
    socket.on('ai_signal_update', (signal: AISignal) => {
      console.log('📊 New AI Signal received:', signal);
      console.log('Signal details:', {
        direction: signal.direction,
        confidence: signal.confidence,
        market_slug: signal.market_slug,
        market_end_time: signal.market_end_time,
      });
      setCurrentSignal(signal);
      console.log('✅ Signal state updated');
    });

    // Chart updates (price)
    socket.on('chart_update', (candle: ChartUpdate) => {
      setCurrentPrice(candle.close);

      // Update candle data
      const newCandle: Candle = {
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        amount: candle.amount,
        is_closed: candle.is_closed,
      };

      setCandles((prev) => {
        if (candle.is_closed) {
          // Add completed candle
          return [...prev, newCandle].slice(-100); // Keep last 100 candles
        } else {
          // Update live candle (last one)
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = newCandle;
          } else {
            updated.push(newCandle);
          }
          return updated;
        }
      });
    });

    // Execution updates (trade status changes)
    socket.on('execution_update', (update: ExecutionUpdate) => {
      console.log('💼 Trade Update:', update);
      setRecentTrades((prev) =>
        prev.map((trade) =>
          trade._id === update.trade_id
            ? { ...trade, status: update.status }
            : trade
        )
      );

      // If new trade opened, refresh the list
      if (update.status === 'OPEN') {
        executionApi.getTrades().then(({ trades }) => {
          const sorted = trades.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setRecentTrades(sorted.slice(0, 5));
        });
      }
    });

    // Cleanup
    return () => {
      socket.off('ai_signal_update');
      socket.off('chart_update');
      socket.off('execution_update');
    };
  }, [socket]);

  const handleTimeframeChange = (timeframe: ChartTimeframe) => {
    console.log('Timeframe changed to:', timeframe);
    setSelectedTimeframe(timeframe);
    // TODO: Fetch historical data for new timeframe from market API
    // Keep existing candles until new data arrives
    // Backend should send appropriate candles based on timeframe
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor your AI trading performance
          </p>
        </div>

        <ConnectionStatus showLabel />
      </div>

      {/* Price Ticker */}
      <PriceTicker price={currentPrice} change24h={price24hChange} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - AI Signal & History */}
        <div className="lg:col-span-1 space-y-6">
          <AISignalCard signal={currentSignal} />
          <PredictionHistory />
        </div>

        {/* Right Columns - Chart & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candlestick Chart */}
          <Card padding="lg">
            {candles.length > 0 ? (
              <div className="space-y-4">
                <CandlestickChart
                  candles={candles}
                  selectedTimeframe={selectedTimeframe}
                  onTimeframeChange={handleTimeframeChange}
                  height={400}
                />
                <VolumeBars candles={candles} height={80} />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-bg-tertiary rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">
                    Waiting for chart data...
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {socket ? 'Connected. Chart will appear when backend sends data.' : 'Connecting to backend...'}
                  </p>
                </div>
              </div>
            )}
          </Card>

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
                  Trades will appear here when the AI places them
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
