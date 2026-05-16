'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/context/socket-context';
import { predictionApi, settingsApi } from '@/lib/api';
import { AISignalCard } from '@/components/dashboard/ai-signal-card';
import { PriceTicker } from '@/components/dashboard/price-ticker';
import { CandlestickChart } from '@/components/charts/candlestick-chart';
import { PredictionHistory } from '@/components/dashboard/prediction-history';
import { AccuracyComparison } from '@/components/dashboard/accuracy-comparison';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import type { AISignal, ChartUpdate } from '@/types/websocket';
import type { Candle, ChartTimeframe } from '@/types/market';
import { Target, TrendingUp } from 'lucide-react';

export default function PredictionsPage() {
  const { socket } = useSocket();
  const [currentSignal, setCurrentSignal] = useState<AISignal | null>(null);
  const [currentPrice, setCurrentPrice] = useState(69420);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>('5m');
  const [strategyActive, setStrategyActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [predData, settingsData] = await Promise.all([
          predictionApi.getCurrent().catch(() => null),
          settingsApi.getSettings(),
        ]);
        if (predData?.prediction) {
          setCurrentSignal(predData.prediction);
        }
        const strategy = settingsData.strategySelection?.active_strategy;
        setStrategyActive(strategy === 'prediction' || strategy === 'both');
      } catch (error) {
        console.error('Failed to load prediction data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleSignal = (data: AISignal) => {
      setCurrentSignal(data);
    };

    const handleChart = (data: ChartUpdate) => {
      if (data?.close) {
        setCurrentPrice(data.close);
        setCandles((prev) => {
          const newCandle: Candle = {
            timestamp: data.timestamp || new Date().toISOString(),
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume || 0,
            amount: 0,
            is_closed: true,
          };
          const updated = [...prev, newCandle];
          return updated.slice(-300);
        });
      }
    };

    socket.on('ai_signal_update', handleSignal);
    socket.on('chart_update', handleChart);

    return () => {
      socket.off('ai_signal_update', handleSignal);
      socket.off('chart_update', handleChart);
    };
  }, [socket]);

  if (loading) return <Loading text="Loading predictions..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">AI Predictions</h1>
          <p className="text-sm text-text-secondary mt-1">
            BTC 5-minute directional predictions
          </p>
        </div>
        <Badge variant={strategyActive ? 'success' : 'default'}>
          {strategyActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Current Price + Signal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card padding="lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent-primary" />
                  <span className="text-sm font-medium text-text-primary">BTC/USDT</span>
                </div>
                <PriceTicker price={currentPrice} />
              </div>
            </CardHeader>
            <CardBody>
              <CandlestickChart
                candles={candles}
                selectedTimeframe={selectedTimeframe}
                onTimeframeChange={setSelectedTimeframe}
                height={320}
              />
            </CardBody>
          </Card>
        </div>

        <div>
          <AISignalCard signal={currentSignal} />
        </div>
      </div>

      {/* Prediction History + Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PredictionHistory />
        <AccuracyComparison />
      </div>
    </div>
  );
}
