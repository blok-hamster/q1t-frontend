'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { cn } from '@/lib/utils/cn';
import type { Candle, ChartTimeframe } from '@/types/market';
import { CHART_TIMEFRAMES } from '@/lib/constants';

interface CandlestickChartProps {
  candles?: Candle[];
  selectedTimeframe?: ChartTimeframe;
  onTimeframeChange?: (timeframe: ChartTimeframe) => void;
  className?: string;
  height?: number;
}

export function CandlestickChart({
  candles = [],
  selectedTimeframe = '5m',
  onTimeframeChange,
  className,
  height = 400,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastCandleCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#8B8D98',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(0, 212, 255, 0.5)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: 'rgba(0, 212, 255, 0.5)',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#8B8D98',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        // Better spacing for candles
        barSpacing: 8,
        minBarSpacing: 4,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00FF88',
      downColor: '#FF3366',
      borderUpColor: '#00FF88',
      borderDownColor: '#FF3366',
      wickUpColor: '#00FF88',
      wickDownColor: '#FF3366',
      // Make candles slimmer
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  // Update chart data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !candles.length) return;

    const currentCandleCount = candles.length;
    const isInitialLoad = isInitialLoadRef.current;

    // Convert and deduplicate candles (keep latest for each timestamp)
    const candleMap = new Map<number, CandlestickData<Time>>();

    candles.forEach((candle) => {
      const time = Math.floor(new Date(candle.timestamp).getTime() / 1000) as Time;
      candleMap.set(time as number, {
        time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      });
    });

    // Convert map to array and sort by time in ascending order
    const chartData = Array.from(candleMap.values()).sort(
      (a, b) => (a.time as number) - (b.time as number)
    );

    // Initial load or timeframe change: load all data
    if (isInitialLoad || currentCandleCount < lastCandleCountRef.current) {
      candlestickSeriesRef.current.setData(chartData);
      // Only fit content on initial load
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
      isInitialLoadRef.current = false;
    } else {
      // Incremental update: only update the latest candle
      // This preserves zoom and scroll position
      const latestCandle = chartData[chartData.length - 1];
      if (latestCandle) {
        candlestickSeriesRef.current.update(latestCandle);
      }
    }

    lastCandleCountRef.current = currentCandleCount;
  }, [candles]);

  const handleTimeframeChange = (timeframe: ChartTimeframe) => {
    // Reset to trigger full reload on next data update
    isInitialLoadRef.current = true;
    lastCandleCountRef.current = 0;
    onTimeframeChange?.(timeframe);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Chart */}
      <div className="bg-bg-primary rounded-lg border border-border overflow-hidden">
        <div ref={chartContainerRef} />
      </div>

      {/* Time period selector */}
      <div className="flex items-center gap-2 justify-center">
        {CHART_TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            type="button"
            onClick={() => handleTimeframeChange(tf.value as ChartTimeframe)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              selectedTimeframe === tf.value
                ? 'bg-accent-muted text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>
    </div>
  );
}
