'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  CandlestickData,
  Time,
  LineStyle,
  IPriceLine,
} from 'lightweight-charts';
import { useSocket } from '@/context/socket-context';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/format';
import type { Candle } from '@/types/market';
import { Layers, BarChart2, Radio } from 'lucide-react';

export interface PolymarketStrikeChartProps {
  marketType?: string;
  strikePrice?: number | null;
  currentPrice?: number | null;
  priceDistance?: number | null;
  upPrice?: number | null;
  downPrice?: number | null;
  candles?: Candle[];
  className?: string;
  height?: number;
}

export function PolymarketStrikeChart({
  marketType = 'btc-5m',
  strikePrice,
  currentPrice: propCurrentPrice,
  priceDistance,
  upPrice,
  downPrice,
  candles: propCandles = [],
  className,
  height = 400,
}: PolymarketStrikeChartProps) {
  const { socket } = useSocket();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const isInitializedRef = useRef(false);
  const lastMidMarketTickRef = useRef(0);

  const [viewMode, setViewMode] = useState<'line' | 'candlestick'>('line');
  const [timeframe, setTimeframe] = useState<'5m' | '15m' | '1h' | '1d'>('5m');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<{ time: number; value: number }[]>([]);
  const [fetchedCandles, setFetchedCandles] = useState<Candle[]>([]);

  const asset = marketType.split('-')[0].toUpperCase();
  const symbol = `${asset}USDT`;
  const defaultPriceForAsset =
    asset === 'ETH' ? 3200 : asset === 'SOL' ? 185 : asset === 'DOGE' ? 0.12 : 69420;

  // Reset state whenever marketType or asset changes so old prices/trajectories never bleed over
  useEffect(() => {
    setCurrentPrice(null);
    setHistoryData([]);
    setFetchedCandles([]);
    isInitializedRef.current = false;
  }, [marketType]);

  // Sync propCurrentPrice when valid and matching current asset
  useEffect(() => {
    if (propCurrentPrice != null && propCurrentPrice > 0) {
      // Basic sanity check: reject BTC price (>30k) when asset is ETH/SOL/DOGE
      if (asset !== 'BTC' && propCurrentPrice > 25000) return;
      setCurrentPrice(propCurrentPrice);
    }
  }, [propCurrentPrice, asset]);

  // Fetch real Binance historical OHLCV candles for the target asset (BTCUSDT, ETHUSDT, SOLUSDT, DOGEUSDT)
  useEffect(() => {
    let isCancelled = false;

    const fetchBinanceKlines = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=60`
        );
        if (!res.ok) throw new Error('Failed to fetch binance klines');
        const klines = await res.json();
        if (isCancelled || !Array.isArray(klines)) return;

        const parsedCandles: Candle[] = klines.map((k: any) => ({
          timestamp: new Date(k[0]).toISOString(),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
          amount: parseFloat(k[7]),
          is_closed: true,
        }));

        const trajectoryPoints = parsedCandles.map((c) => ({
          time: Math.floor(new Date(c.timestamp).getTime() / 1000),
          value: c.close,
        }));

        setFetchedCandles(parsedCandles);
        setHistoryData(trajectoryPoints);

        const latestPrice = parsedCandles[parsedCandles.length - 1]?.close;
        if (latestPrice && latestPrice > 0) {
          setCurrentPrice(latestPrice);
        }
      } catch (err) {
        if (isCancelled) return;
        // Fallback: seed synthetic curve for the specific asset if API fetch is unavailable
        const basePrice = strikePrice || defaultPriceForAsset;
        const nowSec = Math.floor(Date.now() / 1000);
        const initialPoints: { time: number; value: number }[] = [];
        for (let i = 40; i >= 0; i--) {
          const time = nowSec - i * 30;
          const variation =
            (Math.sin(i * 0.4) * 0.0015 + (Math.random() - 0.5) * 0.0008) * basePrice;
          const value = Math.round((basePrice + variation) * 100) / 100;
          initialPoints.push({ time, value });
        }
        setHistoryData(initialPoints);
        setCurrentPrice(basePrice);
      }
    };

    fetchBinanceKlines();

    return () => {
      isCancelled = true;
    };
  }, [marketType, symbol, timeframe, strikePrice, defaultPriceForAsset]);

  // Listen to Socket feeds and strictly filter for current marketType
  useEffect(() => {
    if (!socket) return;

    const appendLiveTick = (price: number) => {
      const nowSec = Math.floor(Date.now() / 1000);

      // Update displayed current price state
      setCurrentPrice(price);

      // Append to lightweight chart directly via update() — avoids full setData re-render
      if (lineSeriesRef.current && isInitializedRef.current) {
        const newPoint = { time: nowSec as Time, value: price };
        try {
          lineSeriesRef.current.update(newPoint);
        } catch (e) {
          // Lightweight charts throws if time goes backwards; safe to ignore
        }
      }
    };

    // Engine mid_market_update — PRIMARY source for all markets including BTC
    const handleMidMarket = (data: any) => {
      const mt = (data?.market_type || 'btc-5m').toLowerCase();
      if (mt !== marketType.toLowerCase()) return;
      const price = data?.asset_price || (mt.startsWith('btc') ? data?.btc_price : null);
      if (price && price > 0) {
        lastMidMarketTickRef.current = Date.now();
        appendLiveTick(price);
      }
    };

    // BTC chart_update — FALLBACK only: skip if mid_market_update fired within last 3s
    const handleChart = (candle: any) => {
      if (!marketType.toLowerCase().startsWith('btc')) return;
      if (candle?.close && candle.close > 0) {
        const msSinceEngine = Date.now() - lastMidMarketTickRef.current;
        if (msSinceEngine > 3000) {
          // Engine hasn't ticked recently — use raw candle as fallback
          appendLiveTick(candle.close);
        }
      }
    };

    socket.on('mid_market_update', handleMidMarket);
    socket.on('chart_update', handleChart);

    return () => {
      socket.off('mid_market_update', handleMidMarket);
      socket.off('chart_update', handleChart);
    };
  }, [socket, marketType]);

  const activePrice = currentPrice || propCurrentPrice || strikePrice || defaultPriceForAsset;
  const isAboveStrike =
    strikePrice != null ? activePrice >= strikePrice : true;
  const lineColor = isAboveStrike ? '#20B2AA' : '#E55353';

  // Initialize Lightweight Chart ONCE with responsive height
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const initialWidth = chartContainerRef.current.clientWidth || 600;
    const isMobile = window.innerWidth < 640;
    const effectiveHeight = isMobile ? 280 : height;

    const chart = createChart(chartContainerRef.current, {
      width: initialWidth,
      height: effectiveHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#8B949E',
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: true, color: '#1B2026' },
        horzLines: { visible: true, color: '#1B2026' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#20B2AA', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#20B2AA', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: '#1B2026',
        textColor: '#8B949E',
        autoScale: true,
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        borderColor: '#1B2026',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false, // Prevent touch vertical scroll trapping on mobile
      },
    });

    const areaSeries = chart.addAreaSeries({
      lineColor,
      topColor: `${lineColor}33`,
      bottomColor: `${lineColor}00`,
      lineWidth: 2,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#20B2AA',
      downColor: '#E55353',
      borderVisible: false,
      wickUpColor: '#20B2AA',
      wickDownColor: '#E55353',
    });

    chartRef.current = chart;
    lineSeriesRef.current = areaSeries;
    candleSeriesRef.current = candlestickSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0 && chartRef.current) {
        const newWidth = entries[0].contentRect.width;
        const newIsMobile = window.innerWidth < 640;
        const newHeight = newIsMobile ? 280 : height;
        if (newWidth > 0) {
          chartRef.current.applyOptions({ width: newWidth, height: newHeight });
        }
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      lineSeriesRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [height, lineColor]);

  // Update Series Visibility
  useEffect(() => {
    if (lineSeriesRef.current && candleSeriesRef.current) {
      if (viewMode === 'line') {
        lineSeriesRef.current.applyOptions({ visible: true });
        candleSeriesRef.current.applyOptions({ visible: false });
      } else {
        lineSeriesRef.current.applyOptions({ visible: false });
        candleSeriesRef.current.applyOptions({ visible: true });
      }
    }
  }, [viewMode]);

  // Dynamic Line Color Shift
  useEffect(() => {
    if (lineSeriesRef.current) {
      lineSeriesRef.current.applyOptions({
        lineColor,
        topColor: `${lineColor}33`,
        bottomColor: `${lineColor}00`,
      });
    }
  }, [lineColor]);

  // Update Horizontal Strike Price Line
  useEffect(() => {
    const series = lineSeriesRef.current;
    if (!series) return;

    if (priceLineRef.current) {
      try {
        series.removePriceLine(priceLineRef.current);
      } catch (e) {
        // ignore
      }
      priceLineRef.current = null;
    }

    if (strikePrice && strikePrice > 0) {
      priceLineRef.current = series.createPriceLine({
        price: strikePrice,
        color: '#D99B00',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `STRIKE ${formatCurrency(strikePrice)}`,
      });
    }
  }, [strikePrice]);

  // Seed Lightweight Charts Series with historical data — RUNS ONCE per market/timeframe load
  useEffect(() => {
    if (!lineSeriesRef.current || !candleSeriesRef.current) return;
    // Skip if already initialized — live updates use series.update() directly
    if (isInitializedRef.current) return;

    const activeCandles = propCandles.length > 0 ? propCandles : fetchedCandles;

    if (activeCandles && activeCandles.length > 0) {
      const formattedCandles: CandlestickData<Time>[] = activeCandles.map((c) => ({
        time: (new Date(c.timestamp).getTime() / 1000) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeriesRef.current.setData(formattedCandles);

      const lineData: LineData<Time>[] = activeCandles.map((c) => ({
        time: (new Date(c.timestamp).getTime() / 1000) as Time,
        value: c.close,
      }));
      lineSeriesRef.current.setData(lineData);
      isInitializedRef.current = true;

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } else if (historyData.length > 0) {
      const sorted = [...historyData].sort((a, b) => a.time - b.time);
      const uniqueData: LineData<Time>[] = [];
      let lastTime = 0;
      for (const pt of sorted) {
        if (pt.time > lastTime) {
          uniqueData.push({ time: pt.time as Time, value: pt.value });
          lastTime = pt.time;
        }
      }
      if (uniqueData.length > 0) {
        lineSeriesRef.current.setData(uniqueData);
        isInitializedRef.current = true;

        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      }
    }
  }, [propCandles, fetchedCandles, historyData]);

  // Distance metrics calculation
  const delta =
    strikePrice != null ? activePrice - strikePrice : priceDistance ?? 0;
  const deltaPct =
    strikePrice && strikePrice > 0 ? (delta / strikePrice) * 100 : 0;

  return (
    <div className={cn('bg-[#0F1215] border border-[#1B2026] select-none', className)}>
      {/* Header Panel */}
      <div className="p-3.5 border-b border-[#1B2026] flex flex-wrap items-center justify-between gap-3 bg-[#16191E]/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
              LIVE {asset}-5M TRAJECTORY
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-xs bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/20">
              <Radio className="h-2.5 w-2.5 animate-pulse" /> POLYMARKET FEED
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-mono text-xl font-bold text-[#E1E4E8] tabular-nums">
              {activePrice ? formatCurrency(activePrice) : '—'}
            </span>
            {strikePrice != null && (
              <span
                className={cn(
                  'font-mono text-xs font-bold tabular-nums px-2 py-0.5 border rounded-xs',
                  isAboveStrike
                    ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                    : 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30'
                )}
              >
                {delta >= 0 ? '+' : ''}
                {formatCurrency(delta)} ({deltaPct >= 0 ? '+' : ''}
                {deltaPct.toFixed(2)}%){' '}
                <span className="text-[10px] text-[#8B949E] uppercase font-mono ml-1">
                  {isAboveStrike ? 'ABOVE STRIKE' : 'BELOW STRIKE'}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Binary Probabilities & View Controls */}
        <div className="flex items-center gap-3">
          {/* YES / NO share prices */}
          {upPrice != null && downPrice != null && (
            <div className="flex items-center gap-1.5 font-mono text-xs bg-[#080A0C] px-2.5 py-1 border border-[#1B2026]">
              <span className="text-[#586069] text-[10px] font-bold">SHARES:</span>
              <span className="text-[#20B2AA] font-bold">YES ${(upPrice).toFixed(2)}</span>
              <span className="text-[#586069]">/</span>
              <span className="text-[#E55353] font-bold">NO ${(downPrice).toFixed(2)}</span>
            </div>
          )}

          {/* Toggle View Mode */}
          <div className="flex items-center bg-[#080A0C] border border-[#1B2026] p-0.5 font-mono text-[10px]">
            <button
              onClick={() => setViewMode('line')}
              className={cn(
                'px-2 py-1 font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer',
                viewMode === 'line'
                  ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/40'
                  : 'text-[#8B949E] hover:text-[#E1E4E8]'
              )}
            >
              <Layers className="h-3 w-3" /> Trajectory
            </button>
            <button
              onClick={() => setViewMode('candlestick')}
              className={cn(
                'px-2 py-1 font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer',
                viewMode === 'candlestick'
                  ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/40'
                  : 'text-[#8B949E] hover:text-[#E1E4E8]'
              )}
            >
              <BarChart2 className="h-3 w-3" /> Candles
            </button>
          </div>

          {/* Timeframe Tabs */}
          <div className="hidden sm:flex items-center bg-[#080A0C] border border-[#1B2026] p-0.5 font-mono text-[10px]">
            {(['5m', '15m', '1h', '1d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'px-2 py-1 uppercase font-bold transition-colors cursor-pointer',
                  timeframe === tf
                    ? 'bg-[#16191E] text-[#20B2AA]'
                    : 'text-[#8B949E] hover:text-[#E1E4E8]'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative p-2 min-h-[400px]">
        <div ref={chartContainerRef} className="w-full min-h-[400px]" />

        {/* Floating Strike Info Overlay */}
        {strikePrice != null && (
          <div className="absolute top-4 left-4 bg-[#080A0C]/90 backdrop-blur-md border border-[#1B2026] px-3 py-1.5 font-mono text-xs flex items-center gap-3 z-10">
            <span className="text-[10px] text-[#586069] font-bold uppercase">WINDOW STRIKE:</span>
            <span className="text-[#D99B00] font-bold tabular-nums">
              {formatCurrency(strikePrice)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
