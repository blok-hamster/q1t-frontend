'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/context/socket-context';
import { TrendingUp, TrendingDown, Radio, CircleOff } from 'lucide-react';
import type { MidMarketState, MidMarketPosition } from '@/types/websocket';

interface MidMarketMonitorProps {
  enabled: boolean;
  marketType?: string;
}

function q2(v: number | null | undefined): number | null {
  return v != null ? Math.round(v * 100) / 100 : null;
}

export const MidMarketMonitor = memo(function MidMarketMonitor({ enabled, marketType = 'btc-5m' }: MidMarketMonitorProps) {
  const { socket } = useSocket();

  // Display state — only thing that causes re-renders
  const [upPrice, setUpPrice] = useState<number | null>(null);
  const [downPrice, setDownPrice] = useState<number | null>(null);
  const [strikePrice, setStrikePrice] = useState<number | null>(null);
  const [priceDistance, setPriceDistance] = useState<number | null>(null);
  const [position, setPosition] = useState<MidMarketPosition | null>(null);
  const [windowEnded, setWindowEnded] = useState(false);
  const [dailyTrades, setDailyTrades] = useState(0);
  const [dailyWins, setDailyWins] = useState(0);
  const [dailyLosses, setDailyLosses] = useState(0);
  const [dailyPnl, setDailyPnl] = useState(0);
  const [isLive, setIsLive] = useState(false);

  // Countdown has its own state — updated immediately, not throttled
  const [windowEndTs, setWindowEndTs] = useState(0);

  const lastEventRef = useRef<number>(0);
  const marketTypeRef = useRef(marketType);
  const isLiveRef = useRef(false);
  const lastWindowEndTsRef = useRef<number>(0);
  marketTypeRef.current = marketType;

  // Reset on market switch
  useEffect(() => {
    lastEventRef.current = 0;
    isLiveRef.current = false;
    lastWindowEndTsRef.current = 0;
    setUpPrice(null);
    setDownPrice(null);
    setStrikePrice(null);
    setPriceDistance(null);
    setPosition(null);
    setWindowEnded(false);
    setWindowEndTs(0);
    setDailyTrades(0);
    setDailyWins(0);
    setDailyLosses(0);
    setDailyPnl(0);
    setIsLive(false);
  }, [marketType]);

  // Socket listener — updates display state directly, no throttle delay
  useEffect(() => {
    if (!socket) return;

    const handler = (data: MidMarketState) => {
      const mt = (data as any).market_type || 'btc-5m';
      if (mt !== marketTypeRef.current) return;
      lastEventRef.current = Date.now();

      // Mark live (only on transition)
      if (!isLiveRef.current) {
        isLiveRef.current = true;
        setIsLive(true);
      }

      // Window end timestamp — immediate
      // If a new window_end_ts arrives that differs from previous, a new window started
      if (data.window_end_ts && data.window_end_ts > 0) {
        if (lastWindowEndTsRef.current !== data.window_end_ts) {
          lastWindowEndTsRef.current = data.window_end_ts;
          setWindowEnded(false);
          setWindowEndTs(data.window_end_ts);
        }
      }

      // Window ended events — immediate
      if (data.type === 'outcome' || data.type === 'window_end') {
        setWindowEnded(true);
        setPosition(null);
        setUpPrice(prev => data.type === 'window_end' ? null : (q2(data.up_price) ?? prev));
        setDownPrice(prev => data.type === 'window_end' ? null : (q2(data.down_price) ?? prev));
        return;
      }
      if (data.type === 'stop_sell') {
        setPosition(null);
        return;
      }

      // Window start — clear ended
      if (data.type === 'window_start') {
        setWindowEnded(false);
      }

      // Position — immediate
      if ('position' in data) {
        const newPos = data.position;
        setPosition(prev => {
          if (prev?.direction === newPos?.direction && prev?.entry_price === newPos?.entry_price) return prev;
          return newPos;
        });
      }

      // Prices — update immediately, skip if same display value
      if (data.up_price != null) setUpPrice(prev => { const v = q2(data.up_price); return prev === v ? prev : v; });
      if (data.down_price != null) setDownPrice(prev => { const v = q2(data.down_price); return prev === v ? prev : v; });
      if (data.strike_price != null) setStrikePrice(prev => prev === data.strike_price ? prev : data.strike_price!);
      if (data.price_distance != null) {
        const d = Math.round(data.price_distance * 10) / 10;
        setPriceDistance(prev => prev === d ? prev : d);
      }

      // Stats — update immediately, skip if same
      if (data.daily_trades != null) setDailyTrades(prev => prev === data.daily_trades ? prev : data.daily_trades);
      if (data.daily_wins != null) setDailyWins(prev => prev === data.daily_wins ? prev : data.daily_wins);
      if (data.daily_losses != null) setDailyLosses(prev => prev === data.daily_losses ? prev : data.daily_losses);
      if (data.daily_pnl != null) {
        const p = q2(data.daily_pnl) ?? 0;
        setDailyPnl(prev => prev === p ? prev : p);
      }
    };

    socket.on('mid_market_update', handler);
    return () => { socket.off('mid_market_update', handler); };
  }, [socket]);

  // Liveness check
  useEffect(() => {
    const id = setInterval(() => {
      const live = enabled && lastEventRef.current > 0 && (Date.now() - lastEventRef.current < 10000);
      if (live !== isLiveRef.current) {
        isLiveRef.current = live;
        setIsLive(live);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [enabled]);

  // P&L
  const pnl = position
    ? Math.round(((position.direction === 'UP' ? (upPrice ?? position.entry_price) : (downPrice ?? position.entry_price)) - position.entry_price) * position.shares * 100) / 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Mid-Market Momentum</h3>
          </div>
          <Badge variant={isLive ? 'success' : enabled ? 'warning' : 'neutral'} size="sm">
            {isLive ? (
              <span className="flex items-center gap-1"><Radio className="h-3 w-3 animate-pulse" /> LIVE</span>
            ) : enabled ? (
              <span className="flex items-center gap-1"><Radio className="h-3 w-3" /> ENABLED</span>
            ) : (
              <span className="flex items-center gap-1"><CircleOff className="h-3 w-3" /> OFF</span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold">
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-positive' : 'bg-text-tertiary'}`} />
            <span className={isLive ? 'text-text-secondary' : 'text-text-tertiary'}>
              {isLive ? 'Bot Active' : enabled ? 'Waiting...' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Price Bars */}
        <div className={`space-y-2 ${isLive && upPrice != null ? 'opacity-100' : 'opacity-40'}`}>
          <PriceBar label="UP" price={upPrice} color="positive" />
          <PriceBar label="DOWN" price={downPrice} color="negative" />
        </div>

        {/* Strike, Distance, Time Left */}
        <div className={`grid grid-cols-3 gap-3 text-xs ${isLive && strikePrice ? 'opacity-100' : 'opacity-40'}`}>
          <div className="bg-bg-tertiary rounded-lg p-2 border border-border/50">
            <p className="text-text-tertiary mb-0.5 text-[10px] uppercase font-bold">Strike</p>
            <p className="font-mono font-bold text-text-primary tabular-nums">
              {strikePrice ? `$${strikePrice.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-2 border border-border/50">
            <p className="text-text-tertiary mb-0.5 text-[10px] uppercase font-bold">Distance</p>
            <p className={`font-mono font-bold tabular-nums ${(priceDistance ?? 0) >= 25 ? 'text-positive' : 'text-text-secondary'}`}>
              {priceDistance != null ? `$${priceDistance.toFixed(1)}` : '—'}
            </p>
          </div>
          <Countdown windowEndTs={windowEndTs} windowEnded={windowEnded} />
        </div>

        {/* Position */}
        <div style={{ display: position ? 'block' : 'none' }}>
          <div className="p-3 border border-accent-primary/30 bg-accent-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-accent-primary uppercase tracking-tighter">ACTIVE POSITION</span>
              {position?.direction === 'UP'
                ? <TrendingUp className="h-4 w-4 text-positive" />
                : <TrendingDown className="h-4 w-4 text-negative" />}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-text-tertiary text-[10px]">Side</p>
                <p className="font-bold text-text-primary">{position?.direction ?? '—'}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-[10px]">Entry</p>
                <p className="font-mono font-bold text-text-primary tabular-nums">${position?.entry_price?.toFixed(2) ?? '—'}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-[10px]">P&L</p>
                <p className={`font-mono font-bold tabular-nums ${pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                  ${pnl.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: !position && windowEnded ? 'block' : 'none' }}>
          <div className="h-[62px] flex flex-col items-center justify-center border border-dashed border-neutral/50 rounded-lg bg-neutral/5">
            <p className="text-[10px] font-bold text-neutral uppercase tracking-widest">Window Ended — Waiting for Next</p>
          </div>
        </div>
        <div style={{ display: !position && !windowEnded ? 'block' : 'none' }}>
          <div className="h-[62px] flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-bg-tertiary/30">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
              {isLive && upPrice == null ? 'Waiting for Window...' : 'No Active Trade'}
            </p>
          </div>
        </div>

        {/* Daily Performance */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
          <div className="text-center">
            <p className="text-[10px] text-text-tertiary uppercase font-bold">Trades</p>
            <p className="text-sm font-bold text-text-primary tabular-nums">{dailyTrades}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-text-tertiary uppercase font-bold">W/L</p>
            <div className="text-sm font-bold tabular-nums">
              <span className="text-positive">{dailyWins}</span>
              <span className="text-text-tertiary mx-0.5">/</span>
              <span className="text-negative">{dailyLosses}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-text-tertiary uppercase font-bold">PnL Today</p>
            <p className={`text-sm font-mono font-bold tabular-nums ${dailyPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
              ${dailyPnl.toFixed(2)}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
});

/**
 * Countdown — completely independent component with its own 1s timer.
 * Only props are windowEndTs (fixed for the window) and windowEnded.
 * Renders immediately when windowEndTs arrives. Never waits for price data.
 */
const Countdown = memo(function Countdown({ windowEndTs, windowEnded }: { windowEndTs: number; windowEnded: boolean }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (windowEnded || !windowEndTs) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, Math.floor(windowEndTs - Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowEndTs, windowEnded]);

  let label: string;
  let color: string;
  if (windowEnded || (remaining <= 0 && windowEndTs > 0)) {
    label = 'ENDED'; color = 'text-negative';
  } else if (remaining > 0) {
    label = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
    color = remaining < 60 ? 'text-neutral' : 'text-text-primary';
  } else {
    label = '—'; color = 'text-text-primary';
  }

  return (
    <div className="bg-bg-tertiary rounded-lg p-2 border border-border/50">
      <p className="text-text-tertiary mb-0.5 text-[10px] uppercase font-bold">Time Left</p>
      <p className={`font-mono font-bold tabular-nums ${color}`}>{label}</p>
    </div>
  );
});

function PriceBar({ label, price, color }: { label: string; price: number | null; color: string }) {
  const pct = price != null ? Math.min(price * 100, 100) : 0;
  const colorVar = `var(--color-${color})`;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-extrabold w-10 uppercase" style={{ color: colorVar }}>{label}</span>
      <div className="flex-1 h-5 bg-bg-tertiary/50 rounded-full overflow-hidden relative border border-border/30">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: colorVar, opacity: 0.6 }} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-text-primary drop-shadow-md tabular-nums">
          {price != null ? `$${price.toFixed(2)}` : '—'}
        </span>
      </div>
      <span className="text-[10px] font-mono text-text-tertiary w-8">$1.00</span>
    </div>
  );
}
