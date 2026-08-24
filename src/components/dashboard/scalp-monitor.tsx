'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useSocket } from '@/context/socket-context';
import { executionApi } from '@/lib/api';
import { Shield, TrendingUp, TrendingDown, Radio, CircleOff, Clock } from 'lucide-react';

interface ScalpMonitorProps {
  enabled: boolean;
  marketType?: string;
}

interface ScalpPosition {
  direction: string;
  entry_price: number;
  num_shares?: number;
  take_profit_price?: number;
  stop_loss_price?: number;
  max_hold_until?: number;
}

function q2(v: number | null | undefined): number | null {
  return v != null ? Math.round(v * 100) / 100 : null;
}

export const ScalpMonitor = memo(function ScalpMonitor({
  enabled,
  marketType = 'btc-5m',
}: ScalpMonitorProps) {
  const { socket } = useSocket();

  const [upPrice, setUpPrice] = useState<number | null>(null);
  const [downPrice, setDownPrice] = useState<number | null>(null);
  const [position, setPosition] = useState<ScalpPosition | null>(null);
  const [dailyTrades, setDailyTrades] = useState(0);
  const [dailyWins, setDailyWins] = useState(0);
  const [dailyLosses, setDailyLosses] = useState(0);
  const [dailyPnl, setDailyPnl] = useState(0);
  const [isLive, setIsLive] = useState(false);

  const lastEventRef = useRef<number>(0);
  const marketTypeRef = useRef(marketType);
  const isLiveRef = useRef(false);
  marketTypeRef.current = marketType;

  // Reset and load initial stats on market switch
  useEffect(() => {
    lastEventRef.current = 0;
    isLiveRef.current = false;
    setUpPrice(null);
    setDownPrice(null);
    setPosition(null);
    setDailyTrades(0);
    setDailyWins(0);
    setDailyLosses(0);
    setDailyPnl(0);
    setIsLive(false);

    executionApi
      .getScalpStats()
      .then((stats) => {
        const ms = stats.per_market?.[marketType];
        if (ms) {
          setDailyTrades(ms.trades || 0);
          setDailyWins(ms.wins || 0);
          setDailyLosses(ms.losses || 0);
          setDailyPnl(ms.pnl || 0);
        }
        const pos = stats.positions?.[marketType];
        if (pos) {
          setPosition({
            direction: pos.direction,
            entry_price: pos.entry_price,
            num_shares: pos.num_shares,
            take_profit_price: pos.take_profit_price,
            stop_loss_price: pos.stop_loss_price,
            max_hold_until: pos.max_hold_until,
          });
        }
      })
      .catch(() => {});
  }, [marketType]);

  // Socket listeners for price updates and scalp events
  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = (data: any) => {
      const mt = (data?.market_type || 'btc-5m').toLowerCase();
      if (mt !== marketTypeRef.current.toLowerCase()) return;
      lastEventRef.current = Date.now();

      if (!isLiveRef.current) {
        isLiveRef.current = true;
        setIsLive(true);
      }

      if (data.up_price != null) setUpPrice((prev) => q2(data.up_price) ?? prev);
      if (data.down_price != null) setDownPrice((prev) => q2(data.down_price) ?? prev);
    };

    const handleScalpEntry = (data: any) => {
      const mt = (data?.market_type || 'btc-5m').toLowerCase();
      if (mt !== marketTypeRef.current.toLowerCase()) return;

      lastEventRef.current = Date.now();
      setPosition({
        direction: data.direction,
        entry_price: data.entry_price,
        num_shares: data.num_shares || 0,
        take_profit_price: data.take_profit,
        stop_loss_price: data.stop_loss,
        max_hold_until: Date.now() + (data.timeout_seconds || 240) * 1000,
      });

      if (data.daily_trades != null) setDailyTrades(data.daily_trades);
      if (data.daily_wins != null) setDailyWins(data.daily_wins);
      if (data.daily_losses != null) setDailyLosses(data.daily_losses);
      if (data.daily_pnl != null) setDailyPnl(q2(data.daily_pnl) ?? 0);
    };

    const handleScalpExit = (data: any) => {
      const mt = (data?.market_type || 'btc-5m').toLowerCase();
      if (mt !== marketTypeRef.current.toLowerCase()) return;

      lastEventRef.current = Date.now();
      setPosition(null);

      if (data.daily_trades != null) setDailyTrades(data.daily_trades);
      if (data.daily_wins != null) setDailyWins(data.daily_wins);
      if (data.daily_losses != null) setDailyLosses(data.daily_losses);
      if (data.daily_pnl != null) setDailyPnl(q2(data.daily_pnl) ?? 0);
    };

    socket.on('mid_market_update', handlePriceUpdate);
    socket.on('scalp_entry', handleScalpEntry);
    socket.on('scalp_exit', handleScalpExit);

    return () => {
      socket.off('mid_market_update', handlePriceUpdate);
      socket.off('scalp_entry', handleScalpEntry);
      socket.off('scalp_exit', handleScalpExit);
    };
  }, [socket]);

  // Liveness check interval
  useEffect(() => {
    const id = setInterval(() => {
      const live =
        enabled &&
        lastEventRef.current > 0 &&
        Date.now() - lastEventRef.current < 10000;
      if (live !== isLiveRef.current) {
        isLiveRef.current = live;
        setIsLive(live);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [enabled]);

  // Live PnL calculation
  const currentPrice = position
    ? position.direction === 'UP'
      ? (upPrice ?? position.entry_price)
      : (downPrice ?? position.entry_price)
    : 0;

  const pnl = position
    ? Math.round((currentPrice - position.entry_price) * (position.num_shares || 0) * 100) / 100
    : 0;

  const winRate = dailyTrades > 0 ? Math.round((dailyWins / dailyTrades) * 100) : 0;

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] select-none font-mono text-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]/60">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#20B2AA]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
            ACTIVE SCALP MONITOR
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {isLive ? (
            <span className="flex items-center gap-1 text-[#20B2AA] font-bold px-2 py-0.5 bg-[#20B2AA]/10 border border-[#20B2AA]/30">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE STREAM
            </span>
          ) : enabled ? (
            <span className="flex items-center gap-1 text-[#D99B00] font-bold px-2 py-0.5 bg-[#D99B00]/10 border border-[#D99B00]/30">
              <Radio className="h-3 w-3" /> WAITING
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#586069] font-bold px-2 py-0.5 bg-[#16191E] border border-[#1B2026]">
              <CircleOff className="h-3 w-3" /> ENGINE INACTIVE
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status indicator line */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold">
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-positive' : 'bg-text-tertiary'}`} />
            <span className={isLive ? 'text-text-secondary' : 'text-text-tertiary'}>
              {isLive ? 'Scalp Engine Active' : enabled ? 'Waiting for Market Ticks...' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Live Prices */}
        <div className={`space-y-2 ${isLive && upPrice != null ? 'opacity-100' : 'opacity-40'}`}>
          <PriceBar label="UP" price={upPrice} color="positive" />
          <PriceBar label="DOWN" price={downPrice} color="negative" />
        </div>

        {/* Active Position Card */}
        {position ? (
          <div className="p-3 border border-[#20B2AA]/30 bg-[#20B2AA]/5 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-[#20B2AA]">
                ACTIVE SCALP POSITION
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-bold ${
                    position.direction === 'UP' ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {position.direction}
                </span>
                {position.direction === 'UP' ? (
                  <TrendingUp className="h-4 w-4 text-positive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-negative" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-text-tertiary text-[10px]">Entry</p>
                <p className="font-mono font-bold text-text-primary tabular-nums">
                  ${position.entry_price.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-[10px]">Take Profit</p>
                <p className="font-mono font-bold text-positive tabular-nums">
                  ${position.take_profit_price?.toFixed(2) ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-[10px]">Stop Loss</p>
                <p className="font-mono font-bold text-negative tabular-nums">
                  ${position.stop_loss_price?.toFixed(2) ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-[10px]">P&L</p>
                <p
                  className={`font-mono font-bold tabular-nums ${
                    pnl >= 0 ? 'text-positive' : 'text-negative'
                  }`}
                >
                  ${pnl.toFixed(2)}
                </p>
              </div>
            </div>

            {position.max_hold_until && (
              <HoldCountdown targetTs={position.max_hold_until} />
            )}
          </div>
        ) : (
          <div className="h-[68px] flex flex-col items-center justify-center border border-dashed border-[#1B2026] rounded-lg bg-[#080A0C]">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
              {isLive ? 'Scanning for Scalp Entry' : 'No Open Scalp Position'}
            </p>
          </div>
        )}

        {/* Daily Performance Stats */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#1B2026]">
          <div className="text-center">
            <p className="text-[10px] text-text-tertiary uppercase font-bold">Trades</p>
            <p className="text-sm font-bold text-text-primary tabular-nums">{dailyTrades}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-text-tertiary uppercase font-bold">W / L</p>
            <div className="text-sm font-bold tabular-nums">
              <span className="text-positive">{dailyWins}</span>
              <span className="text-text-tertiary mx-0.5">/</span>
              <span className="text-negative">{dailyLosses}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-text-tertiary uppercase font-bold">Win Rate</p>
            <p className="text-sm font-bold text-text-primary tabular-nums">
              {dailyTrades > 0 ? `${winRate}%` : '—'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-text-tertiary uppercase font-bold">PnL Today</p>
            <p
              className={`text-sm font-mono font-bold tabular-nums ${
                dailyPnl >= 0 ? 'text-positive' : 'text-negative'
              }`}
            >
              ${dailyPnl.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

const HoldCountdown = memo(function HoldCountdown({ targetTs }: { targetTs: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.floor((targetTs - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTs]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const timeStr = `${m}:${String(s).padStart(2, '0')}`;

  return (
    <div className="flex items-center justify-between text-[10px] bg-[#080A0C] px-2.5 py-1 rounded border border-[#1B2026]">
      <div className="flex items-center gap-1 text-text-tertiary">
        <Clock className="h-3 w-3 text-[#20B2AA]" />
        <span>MAX HOLD TIMEOUT</span>
      </div>
      <span
        className={`font-mono font-bold ${
          remaining < 30 ? 'text-negative animate-pulse' : 'text-[#20B2AA]'
        }`}
      >
        {remaining > 0 ? timeStr : 'TIMEOUT EXPIRED'}
      </span>
    </div>
  );
});

function PriceBar({ label, price, color }: { label: string; price: number | null; color: string }) {
  const pct = price != null ? Math.min(price * 100, 100) : 0;
  const colorVar = `var(--color-${color})`;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-extrabold w-10 uppercase" style={{ color: colorVar }}>
        {label}
      </span>
      <div className="flex-1 h-5 bg-[#080A0C] rounded-full overflow-hidden relative border border-[#1B2026]">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: colorVar, opacity: 0.6 }} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-text-primary drop-shadow-md tabular-nums">
          {price != null ? `$${price.toFixed(2)}` : '—'}
        </span>
      </div>
      <span className="text-[10px] font-mono text-text-tertiary w-8">$1.00</span>
    </div>
  );
}
