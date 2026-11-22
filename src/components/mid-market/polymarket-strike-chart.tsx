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
import { marketApi } from '@/lib/api/market';
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
  const isLineInitializedRef = useRef(false);
  const isCandleInitializedRef = useRef(false);
  const lastMidMarketTickRef = useRef(0);
  const latestStrikeRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<'line' | 'candlestick'>('line');
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const [timeframe, setTimeframe] = useState<'5m' | '15m' | '1h' | '1d'>('5m');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<{ time: number; value: number }[]>([]);
  const [fetchedCandles, setFetchedCandles] = useState<Candle[]>([]);

  const [liveStrikePrice, setLiveStrikePrice] = useState<number | null>(null);
  const [liveUpPrice, setLiveUpPrice] = useState<number | null>(null);
  const [liveDownPrice, setLiveDownPrice] = useState<number | null>(null);
  const [livePriceDistance, setLivePriceDistance] = useState<number | null>(null);

  const asset = marketType.split('-')[0].toUpperCase();
  const symbol = `${asset}USDT`;
  latestStrikeRef.current = strikePrice || liveStrikePrice || null;

  const marketTimeframe = (marketType.split('-')[1] as '5m' | '15m') || '5m';

  // Reset state and clear chart series whenever marketType changes
  useEffect(() => {
    setCurrentPrice(null);
    setHistoryData([]);
    setFetchedCandles([]);
    setLiveStrikePrice(null);
    setLiveUpPrice(null);
    setLiveDownPrice(null);
    setLivePriceDistance(null);
    setTimeframe(marketTimeframe);
    isLineInitializedRef.current = false;
    isCandleInitializedRef.current = false;
    lastMidMarketTickRef.current = 0;

    if (lineSeriesRef.current) {
      try { lineSeriesRef.current.setData([]); } catch (e) {}
    }
    if (candleSeriesRef.current) {
      try { candleSeriesRef.current.setData([]); } catch (e) {}
    }
    if (priceLineRef.current && lineSeriesRef.current) {
      try { lineSeriesRef.current.removePriceLine(priceLineRef.current); } catch (e) {}
      priceLineRef.current = null;
    }
  }, [marketType, marketTimeframe]);

  // Sync propCurrentPrice ONLY when currentPrice is null (prevents parent state from stomping on live socket ticks)
  useEffect(() => {
    if (propCurrentPrice != null && propCurrentPrice > 0 && currentPrice === null) {
      // Basic sanity check: reject BTC price (>30k) when asset is ETH/SOL/DOGE
      if (asset !== 'BTC' && propCurrentPrice > 25000) return;
      setCurrentPrice(propCurrentPrice);
    }
  }, [propCurrentPrice, asset, currentPrice]);

  // Seed Trajectory ('line') mode from Polymarket's 60s Chainlink TWAP history
  useEffect(() => {
    let isCancelled = false;

    const fetchPolymarketHistory = async () => {
      try {
        const points = await marketApi.getPriceHistory(marketType);
        if (isCancelled || !Array.isArray(points) || points.length === 0) return;

        const sorted = [...points].sort((a, b) => a.time - b.time);
        const uniqueData: LineData<Time>[] = [];
        let lastTime = 0;
        for (const pt of sorted) {
          if (pt.time > lastTime && pt.value > 0) {
            uniqueData.push({ time: pt.time as Time, value: pt.value });
            lastTime = pt.time;
          }
        }
        if (uniqueData.length === 0) return;

        setHistoryData(
          uniqueData.map((pt) => ({ time: Number(pt.time), value: pt.value }))
        );

        const latestTwap = uniqueData[uniqueData.length - 1]?.value;
        if (latestTwap && latestTwap > 0 && lastMidMarketTickRef.current === 0) {
          setCurrentPrice(latestTwap);
        }

        if (lineSeriesRef.current) {
          lineSeriesRef.current.setData(uniqueData);
          isLineInitializedRef.current = true;

          if (chartRef.current && viewModeRef.current === 'line') {
            chartRef.current.priceScale('right').applyOptions({ autoScale: true });
            chartRef.current.timeScale().fitContent();
          }
        }
      } catch {
        // Leave Trajectory empty until live pm_price ticks arrive (never synthesize fake prices)
      }
    };

    fetchPolymarketHistory();

    return () => {
      isCancelled = true;
    };
  }, [marketType]);

  // Fetch Binance OHLCV candles ONLY for Candlestick view without mutating Trajectory or live displayed price
  useEffect(() => {
    if (viewMode !== 'candlestick') return;
    let isCancelled = false;
    isCandleInitializedRef.current = false;

    const fetchBinanceKlines = async () => {
      try {
        const activeInterval = timeframe || marketTimeframe;
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${activeInterval}&limit=60`
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

        setFetchedCandles(parsedCandles);

        if (candleSeriesRef.current) {
          const formattedCandles: CandlestickData<Time>[] = parsedCandles.map((c) => ({
            time: (new Date(c.timestamp).getTime() / 1000) as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));
          candleSeriesRef.current.setData(formattedCandles);
          isCandleInitializedRef.current = true;

          if (chartRef.current) {
            chartRef.current.priceScale('right').applyOptions({ autoScale: true });
            chartRef.current.timeScale().fitContent();
          }
        }
      } catch {
        // Ignore candle fetch error; Trajectory uses Polymarket TWAP60
      }
    };

    fetchBinanceKlines();

    return () => {
      isCancelled = true;
    };
  }, [viewMode, symbol, timeframe, marketTimeframe]);

  // Listen to Socket feeds and strictly filter for current marketType
  useEffect(() => {
    if (!socket) return;

    const appendLiveTick = (price: number) => {
      const nowSec = Math.floor(Date.now() / 1000);

      // Update displayed current price state
      setCurrentPrice(price);

      // Append to lightweight chart directly via update() — avoids full setData re-render
      if (lineSeriesRef.current) {
        const newPoint = { time: nowSec as Time, value: price };
        if (!isLineInitializedRef.current) {
          try {
            lineSeriesRef.current.setData([newPoint]);
            isLineInitializedRef.current = true;
          } catch {
            // ignore
          }
        } else {
          try {
            lineSeriesRef.current.update(newPoint);
          } catch {
            // Lightweight charts throws if time goes backwards; safe to ignore
          }
        }
      }
    };

    // Engine mid_market_update — SOLE AUTHORITATIVE SOURCE for all markets (btc-5m, btc-15m, eth-5m, eth-15m, sol-5m, doge-5m)
    const handleMidMarket = (data: any) => {
      if (data?.type === 'heartbeat') return;
      const mt = (data?.market_type || 'btc-5m').toLowerCase();
      if (mt !== marketType.toLowerCase()) return;

      // Preserve valid positive strike price (never overwrite with null on window end ticks)
      if (typeof data.strike_price === 'number' && data.strike_price > 0) {
        setLiveStrikePrice(data.strike_price);
      }
      const nextUp =
        typeof data.ask_up === 'number' && data.ask_up >= 0
          ? data.ask_up
          : data.up_price;
      if (typeof nextUp === 'number' && nextUp >= 0) {
        setLiveUpPrice(nextUp);
      }
      const nextDown =
        typeof data.ask_down === 'number' && data.ask_down >= 0
          ? data.ask_down
          : data.down_price;
      if (typeof nextDown === 'number' && nextDown >= 0) {
        setLiveDownPrice(nextDown);
      }
      const nextDistance =
        typeof data.pm_price_distance === 'number'
          ? data.pm_price_distance
          : data.price_distance;
      if (typeof nextDistance === 'number') {
        setLivePriceDistance(nextDistance);
      }

      const price =
        typeof data?.pm_price === 'number' && data.pm_price > 0
          ? data.pm_price
          : typeof data?.asset_price === 'number' && data.asset_price > 0
            ? data.asset_price
            : null;
      if (price && price > 0) {
        lastMidMarketTickRef.current = Date.now();
        appendLiveTick(price);
      }
    };

    socket.on('mid_market_update', handleMidMarket);

    return () => {
      socket.off('mid_market_update', handleMidMarket);
    };
  }, [socket, marketType]);

  const effectiveStrikePrice = strikePrice ?? liveStrikePrice;
  const effectiveUpPrice = upPrice ?? liveUpPrice;
  const effectiveDownPrice = downPrice ?? liveDownPrice;
  const effectivePriceDistance = priceDistance ?? livePriceDistance;

  const activePrice = currentPrice ?? propCurrentPrice ?? effectiveStrikePrice ?? null;
  const isAboveStrike =
    activePrice != null && effectiveStrikePrice != null ? activePrice >= effectiveStrikePrice : true;
  const lineColor = isAboveStrike ? '#20B2AA' : '#E55353';

  // Initialize Lightweight Chart ONCE with responsive height — DO NOT include lineColor in deps to avoid chart re-creation loop
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
      lineColor: '#20B2AA',
      topColor: '#20B2AA33',
      bottomColor: '#20B2AA00',
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
  }, [height]);

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

    if (effectiveStrikePrice && effectiveStrikePrice > 0) {
      priceLineRef.current = series.createPriceLine({
        price: effectiveStrikePrice,
        color: '#D99B00',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `STRIKE ${formatCurrency(effectiveStrikePrice)}`,
      });
    }
  }, [effectiveStrikePrice]);

  // Seed Lightweight Charts Series independently for Trajectory vs Candles — NEVER overwrite Trajectory with Binance candles
  useEffect(() => {
    if (lineSeriesRef.current && !isLineInitializedRef.current && historyData.length > 0) {
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
        isLineInitializedRef.current = true;

        if (chartRef.current && viewMode === 'line') {
          chartRef.current.timeScale().fitContent();
        }
      }
    }

    const activeCandles = propCandles.length > 0 ? propCandles : fetchedCandles;
    if (candleSeriesRef.current && !isCandleInitializedRef.current && activeCandles.length > 0) {
      const formattedCandles: CandlestickData<Time>[] = activeCandles.map((c) => ({
        time: (new Date(c.timestamp).getTime() / 1000) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeriesRef.current.setData(formattedCandles);
      isCandleInitializedRef.current = true;

      if (chartRef.current && viewMode === 'candlestick') {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [propCandles, fetchedCandles, historyData, viewMode]);

  // Distance metrics calculation
  const delta =
    activePrice != null && effectiveStrikePrice != null
      ? activePrice - effectiveStrikePrice
      : effectivePriceDistance ?? null;
  const deltaPct =
    delta != null && effectiveStrikePrice && effectiveStrikePrice > 0
      ? (delta / effectiveStrikePrice) * 100
      : null;

  return (
    <div className={cn('bg-[#0F1215] border border-[#1B2026] select-none', className)}>
      {/* Header Panel */}
      <div className="p-3.5 border-b border-[#1B2026] flex flex-wrap items-center justify-between gap-3 bg-[#16191E]/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
              LIVE {marketType.toUpperCase()} TRAJECTORY
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-xs bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/20">
              <Radio className="h-2.5 w-2.5 animate-pulse" /> POLYMARKET FEED
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-mono text-xl font-bold text-[#E1E4E8] tabular-nums">
              {activePrice != null ? formatCurrency(activePrice) : '—'}
            </span>
            {effectiveStrikePrice != null && delta != null && deltaPct != null && (
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
          {effectiveUpPrice != null && effectiveDownPrice != null && (
            <div className="flex items-center gap-1.5 font-mono text-xs bg-[#080A0C] px-2.5 py-1 border border-[#1B2026]">
              <span className="text-[#586069] text-[10px] font-bold">SHARES:</span>
              <span className="text-[#20B2AA] font-bold">YES ${(effectiveUpPrice).toFixed(2)}</span>
              <span className="text-[#586069]">/</span>
              <span className="text-[#E55353] font-bold">NO ${(effectiveDownPrice).toFixed(2)}</span>
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
      <div className="relative p-2 min-h-[280px] sm:min-h-[400px]">
        <div ref={chartContainerRef} className="w-full min-h-[280px] sm:min-h-[400px]" />

        {/* Floating Strike Info Overlay */}
        {effectiveStrikePrice != null && (
          <div className="absolute top-4 left-4 bg-[#080A0C]/90 backdrop-blur-md border border-[#1B2026] px-3 py-1.5 font-mono text-xs flex items-center gap-3 z-10">
            <span className="text-[10px] text-[#586069] font-bold uppercase">WINDOW STRIKE:</span>
            <span className="text-[#D99B00] font-bold tabular-nums">
              {formatCurrency(effectiveStrikePrice)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
