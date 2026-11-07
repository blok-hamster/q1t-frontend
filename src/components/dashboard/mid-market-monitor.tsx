'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useSocket } from '@/context/socket-context';
import { executionApi } from '@/lib/api';
import { TrendingUp, TrendingDown, Radio, CircleOff } from 'lucide-react';
import type { MidMarketState, MidMarketPosition } from '@/types/websocket';

interface MidMarketMonitorProps {
  enabled: boolean;
  marketType?: string;
}

function q2(v: number | null | undefined): number | null {
  return v != null ? Math.round(v * 100) / 100 : null;
}

function q4(v: number | null | undefined): number | null {
  return v != null ? Math.round(v * 10000) / 10000 : null;
}

function calculateTakerFee(shares: number, price: number): number {
  if (price <= 0 || price >= 1) return 0;
  return Math.round(shares * 0.07 * price * (1.0 - price) * 10000) / 10000;
}

function formatDistance(marketType: string, value: number): string {
  const asset = marketType.split('-')[0].toUpperCase();
  if (asset === 'DOGE') return `$${value.toFixed(4)}`;
  if (asset === 'SOL') return `$${value.toFixed(2)}`;
  if (asset === 'ETH') return `$${value.toFixed(1)}`;
  return `$${value.toFixed(1)}`;
}

function isDistanceSignificant(marketType: string, value: number): boolean {
  const asset = marketType.split('-')[0].toUpperCase();
  if (asset === 'DOGE') return value >= 0.0002;
  if (asset === 'SOL') return value >= 0.10;
  if (asset === 'ETH') return value >= 3;
  return value >= 25;
}

export const MidMarketMonitor = memo(function MidMarketMonitor({
  enabled,
  marketType = 'btc-5m',
}: MidMarketMonitorProps) {
  const { socket } = useSocket();

  const [upPrice, setUpPrice] = useState<number | null>(null);
  const [downPrice, setDownPrice] = useState<number | null>(null);
  const [askUp, setAskUp] = useState<number | null>(null);
  const [askDown, setAskDown] = useState<number | null>(null);
  const [bidUp, setBidUp] = useState<number | null>(null);
  const [bidDown, setBidDown] = useState<number | null>(null);
  const [fvUp, setFvUp] = useState<number | null>(null);
  const [fvDown, setFvDown] = useState<number | null>(null);
  const [fvEdgeUp, setFvEdgeUp] = useState<number | null>(null);
  const [fvEdgeDown, setFvEdgeDown] = useState<number | null>(null);
  const [minFvEdge, setMinFvEdge] = useState<number>(0.04);
  const [entryMinAsk, setEntryMinAsk] = useState<number>(0.65);
  const [entryMaxAsk, setEntryMaxAsk] = useState<number>(0.85);
  const [fvStopProb, setFvStopProb] = useState<number>(0.30);
  const [fvStopBid, setFvStopBid] = useState<number>(0.42);

  const [strikePrice, setStrikePrice] = useState<number | null>(null);
  const [priceDistance, setPriceDistance] = useState<number | null>(null);
  const [position, setPosition] = useState<MidMarketPosition | null>(null);
  const [windowEnded, setWindowEnded] = useState(false);
  const [dailyTrades, setDailyTrades] = useState(0);
  const [dailyWins, setDailyWins] = useState(0);
  const [dailyLosses, setDailyLosses] = useState(0);
  const [dailyPnl, setDailyPnl] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [windowEndTs, setWindowEndTs] = useState(0);

  const lastEventRef = useRef<number>(0);
  const marketTypeRef = useRef(marketType);
  const isLiveRef = useRef(false);
  const lastWindowEndTsRef = useRef<number>(0);
  marketTypeRef.current = marketType;

  useEffect(() => {
    lastEventRef.current = 0;
    isLiveRef.current = false;
    lastWindowEndTsRef.current = 0;
    setUpPrice(null);
    setDownPrice(null);
    setAskUp(null);
    setAskDown(null);
    setBidUp(null);
    setBidDown(null);
    setFvUp(null);
    setFvDown(null);
    setFvEdgeUp(null);
    setFvEdgeDown(null);
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

    executionApi
      .getMidMarketStats()
      .then((stats) => {
        const ms = stats.per_market?.[marketType];
        if (ms) {
          setDailyTrades(ms.trades);
          setDailyWins(ms.wins);
          setDailyLosses(ms.losses);
          setDailyPnl(ms.pnl);
        }
        const posRaw = stats.positions?.[marketType];
        const pos = Array.isArray(posRaw) ? posRaw[0] : posRaw;
        if (pos) {
          setPosition({
            direction: pos.direction,
            entry_price: pos.entry_price,
            shares: pos.num_shares || 0,
            probe: pos.probe === true,
            stop_price: pos.stop_loss_price,
            fair_value_at_entry: pos.fair_value_at_entry,
            fair_value_edge_at_entry: pos.fair_value_edge_at_entry,
          });
        }
      })
      .catch(() => {});
  }, [marketType]);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: MidMarketState) => {
      const mt = data.market_type || 'btc-5m';
      if (mt !== marketTypeRef.current) return;
      lastEventRef.current = Date.now();

      if (!isLiveRef.current) {
        isLiveRef.current = true;
        setIsLive(true);
      }

      if (data.window_end_ts && data.window_end_ts > 0) {
        if (lastWindowEndTsRef.current !== data.window_end_ts) {
          lastWindowEndTsRef.current = data.window_end_ts;
          setWindowEnded(false);
          setWindowEndTs(data.window_end_ts);
        }
      }

      if (data.type === 'outcome' || data.type === 'window_end') {
        setWindowEnded(true);
        setPosition(null);
        if (data.type === 'window_end') {
          setUpPrice(null);
          setDownPrice(null);
          setAskUp(null);
          setAskDown(null);
          setFvUp(null);
          setFvDown(null);
          setFvEdgeUp(null);
          setFvEdgeDown(null);
        }
        return;
      }

      if (data.type === 'stop_sell') {
        setPosition(null);
        return;
      }

      if (data.type === 'window_start') {
        setWindowEnded(false);
      }

      if ('position' in data && data.position) {
        const newPos = data.position;
        setPosition((prev) => {
          if (prev?.direction === newPos?.direction && prev?.entry_price === newPos?.entry_price) return prev;
          return newPos;
        });
      }

      if (data.up_price != null) setUpPrice((prev) => { const v = q2(data.up_price); return prev === v ? prev : v; });
      if (data.down_price != null) setDownPrice((prev) => { const v = q2(data.down_price); return prev === v ? prev : v; });
      if ('ask_up' in data) setAskUp(q2(data.ask_up));
      if ('ask_down' in data) setAskDown(q2(data.ask_down));
      if ('bid_up' in data) setBidUp(q2(data.bid_up));
      if ('bid_down' in data) setBidDown(q2(data.bid_down));
      if (data.fair_value_up != null) setFvUp(q4(data.fair_value_up));
      if (data.fair_value_down != null) setFvDown(q4(data.fair_value_down));
      if ('fv_edge_up' in data) setFvEdgeUp(q4(data.fv_edge_up));
      if ('fv_edge_down' in data) setFvEdgeDown(q4(data.fv_edge_down));
      if (data.min_fv_edge != null) setMinFvEdge(data.min_fv_edge);
      if (data.entry_min_ask != null) setEntryMinAsk(data.entry_min_ask);
      if (data.entry_max_ask != null) setEntryMaxAsk(data.entry_max_ask);
      if (data.fv_stop_prob != null) setFvStopProb(data.fv_stop_prob);
      if (data.fv_stop_bid != null) setFvStopBid(data.fv_stop_bid);

      if (data.strike_price != null) setStrikePrice((prev) => (prev === data.strike_price ? prev : data.strike_price));
      if (data.price_distance != null) {
        const d = Math.round(data.price_distance * 10) / 10;
        setPriceDistance((prev) => (prev === d ? prev : d));
      }

      if (data.daily_trades != null) setDailyTrades((prev) => (prev === data.daily_trades ? prev : data.daily_trades));
      if (data.daily_wins != null) setDailyWins((prev) => (prev === data.daily_wins ? prev : data.daily_wins));
      if (data.daily_losses != null) setDailyLosses((prev) => (prev === data.daily_losses ? prev : data.daily_losses));
      if (data.daily_pnl != null) {
        const p = q2(data.daily_pnl) ?? 0;
        setDailyPnl((prev) => (prev === p ? prev : p));
      }
    };

    socket.on('mid_market_update', handler);

    const entryHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (mt !== marketTypeRef.current) return;
      setPosition({
        direction: data.direction,
        entry_price: data.entry_price,
        shares: data.num_shares || 0,
        probe: data.probe === true,
        stop_price: data.stop_price,
        fair_value_at_entry: data.fair_value,
        fair_value_edge_at_entry: data.fair_value_edge,
      });
      if (data.daily_trades != null) setDailyTrades(data.daily_trades);
      if (data.daily_wins != null) setDailyWins(data.daily_wins);
      if (data.daily_losses != null) setDailyLosses(data.daily_losses);
      if (data.daily_pnl != null) setDailyPnl(q2(data.daily_pnl) ?? 0);
    };

    const stopHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (mt !== marketTypeRef.current) return;
      setPosition(null);
      if (data.daily_trades != null) setDailyTrades(data.daily_trades);
      if (data.daily_wins != null) setDailyWins(data.daily_wins);
      if (data.daily_losses != null) setDailyLosses(data.daily_losses);
      if (data.daily_pnl != null) setDailyPnl(q2(data.daily_pnl) ?? 0);
    };

    const resolvedHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (mt !== marketTypeRef.current) return;
      setPosition(null);
      if (data.daily_trades != null) setDailyTrades(data.daily_trades);
      if (data.daily_wins != null) setDailyWins(data.daily_wins);
      if (data.daily_losses != null) setDailyLosses(data.daily_losses);
      if (data.daily_pnl != null) setDailyPnl(q2(data.daily_pnl) ?? 0);
    };

    socket.on('mid_market_entry', entryHandler);
    socket.on('mid_market_stop', stopHandler);
    socket.on('mid_market_resolved', resolvedHandler);

    return () => {
      socket.off('mid_market_update', handler);
      socket.off('mid_market_entry', entryHandler);
      socket.off('mid_market_stop', stopHandler);
      socket.off('mid_market_resolved', resolvedHandler);
    };
  }, [socket]);

  useEffect(() => {
    const id = setInterval(() => {
      const live = enabled && lastEventRef.current > 0 && Date.now() - lastEventRef.current < 10000;
      if (live !== isLiveRef.current) {
        isLiveRef.current = live;
        setIsLive(live);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [enabled]);

  // Fee-aware mark-to-bid P&L on active position
  const heldBid = position
    ? position.direction === 'UP'
      ? (bidUp ?? upPrice ?? position.entry_price)
      : (bidDown ?? downPrice ?? position.entry_price)
    : null;
  const heldFv = position
    ? position.direction === 'UP'
      ? fvUp
      : fvDown
    : null;
  const pnl = position && heldBid != null
    ? (() => {
        const entryFee = calculateTakerFee(position.shares, position.entry_price);
        const exitFee = heldBid >= 0.99 ? 0 : calculateTakerFee(position.shares, heldBid);
        return Math.round(((heldBid - position.entry_price) * position.shares - entryFee - exitFee) * 100) / 100;
      })()
    : 0;

  const displayUpAsk = askUp ?? upPrice;
  const displayDownAsk = askDown ?? downPrice;

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] select-none">
      <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]/60">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#20B2AA]" aria-hidden="true" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#E1E4E8]">
            FAIR-VALUE ALPHA MONITOR
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {isLive ? (
            <span className="flex items-center gap-1 text-[#20B2AA] font-bold px-2 py-0.5 bg-[#20B2AA]/10 border border-[#20B2AA]/30">
              <Radio className="h-3 w-3 animate-pulse" aria-hidden="true" /> LIVE STREAM
            </span>
          ) : enabled ? (
            <span className="flex items-center gap-1 text-[#D99B00] font-bold px-2 py-0.5 bg-[#D99B00]/10 border border-[#D99B00]/30">
              <Radio className="h-3 w-3" aria-hidden="true" /> WAITING
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#586069] font-bold px-2 py-0.5 bg-[#16191E] border border-[#1B2026]">
              <CircleOff className="h-3 w-3" aria-hidden="true" /> ENGINE INACTIVE
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold">
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-positive' : 'bg-text-tertiary'}`} />
            <span className={isLive ? 'text-text-secondary' : 'text-text-tertiary'}>
              {isLive ? 'Model D Active' : enabled ? 'Waiting...' : 'Disabled'}
            </span>
          </div>
          <span className="text-text-tertiary tabular-nums">
            Band ${entryMinAsk.toFixed(2)}–${entryMaxAsk.toFixed(2)} · Min +{(minFvEdge * 100).toFixed(1)}¢
          </span>
        </div>

        {/* Ask vs Black-Scholes Fair-Value Bars */}
        <div className={`space-y-2.5 ${isLive && (displayUpAsk != null || displayDownAsk != null) ? 'opacity-100' : 'opacity-40'}`}>
          <AlphaBar
            label="UP"
            ask={displayUpAsk}
            fv={fvUp}
            edge={fvEdgeUp}
            minEdge={minFvEdge}
            minAsk={entryMinAsk}
            maxAsk={entryMaxAsk}
            color="positive"
          />
          <AlphaBar
            label="DOWN"
            ask={displayDownAsk}
            fv={fvDown}
            edge={fvEdgeDown}
            minEdge={minFvEdge}
            minAsk={entryMinAsk}
            maxAsk={entryMaxAsk}
            color="negative"
          />
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
            <p
              className={`font-mono font-bold tabular-nums ${
                priceDistance != null && isDistanceSignificant(marketType, priceDistance)
                  ? 'text-positive'
                  : 'text-text-secondary'
              }`}
            >
              {priceDistance != null ? formatDistance(marketType, priceDistance) : '—'}
            </p>
          </div>
          <Countdown windowEndTs={windowEndTs} windowEnded={windowEnded} />
        </div>

        {/* Active Model D Position */}
        {position ? (
          <div className="p-3 border rounded-lg border-accent-primary/30 bg-accent-muted">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-accent-primary">
                  ACTIVE POSITION
                </span>
                {position.probe && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded-xs bg-[#D99B00]/15 text-[#D99B00] border border-[#D99B00]/30">
                    PROBE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-tertiary tabular-nums">
                  {position.shares} SH
                </span>
                <span className={`text-xs font-bold ${position.direction === 'UP' ? 'text-positive' : 'text-negative'}`}>
                  {position.direction}
                </span>
                {position.direction === 'UP' ? (
                  <TrendingUp className="h-4 w-4 text-positive" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-negative" aria-hidden="true" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-text-tertiary text-[10px]">Entry</p>
                <p className="font-mono font-bold text-text-primary tabular-nums">
                  ${position.entry_price.toFixed(2)}
                </p>
                {position.fair_value_edge_at_entry != null && (
                  <p className="text-[9px] text-positive tabular-nums">
                    +{(position.fair_value_edge_at_entry * 100).toFixed(1)}¢ edge
                  </p>
                )}
              </div>
              <div>
                <p className="text-text-tertiary text-[10px]">Live FV</p>
                <p
                  className={`font-mono font-bold tabular-nums ${
                    heldFv != null && heldFv < fvStopProb ? 'text-negative' : 'text-positive'
                  }`}
                >
                  {heldFv != null ? `${(heldFv * 100).toFixed(0)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-[10px]">FV Stop</p>
                <p className="font-mono font-bold text-negative tabular-nums">
                  &lt;{(fvStopProb * 100).toFixed(0)}% / ${(position.stop_price ?? fvStopBid).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-[10px]">Net MTM</p>
                <p className={`font-mono font-bold tabular-nums ${pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : windowEnded ? (
          <div className="h-[62px] flex flex-col items-center justify-center border border-dashed border-neutral/50 rounded-lg bg-neutral/5">
            <p className="text-[10px] font-bold text-neutral uppercase tracking-widest">
              Window Ended — Resolving @ $1.00 / $0.00
            </p>
          </div>
        ) : (
          <div className="h-[62px] flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-bg-tertiary/30">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
              {isLive && displayUpAsk == null ? 'Waiting for Window...' : 'Scanning for Post-Fee Alpha...'}
            </p>
          </div>
        )}

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
      </div>
    </div>
  );
});

const Countdown = memo(function Countdown({
  windowEndTs,
  windowEnded,
}: {
  windowEndTs: number;
  windowEnded: boolean;
}) {
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
    label = 'ENDED';
    color = 'text-negative';
  } else if (remaining > 0) {
    label = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
    color = remaining < 60 ? 'text-neutral' : 'text-text-primary';
  } else {
    label = '—';
    color = 'text-text-primary';
  }

  return (
    <div className="bg-bg-tertiary rounded-lg p-2 border border-border/50">
      <p className="text-text-tertiary mb-0.5 text-[10px] uppercase font-bold">Time Left</p>
      <p className={`font-mono font-bold tabular-nums ${color}`}>{label}</p>
    </div>
  );
});

function AlphaBar({
  label,
  ask,
  fv,
  edge,
  minEdge,
  minAsk,
  maxAsk,
  color,
}: {
  label: string;
  ask: number | null;
  fv: number | null;
  edge: number | null;
  minEdge: number;
  minAsk: number;
  maxAsk: number;
  color: string;
}) {
  const pct = ask != null ? Math.min(ask * 100, 100) : 0;
  const fvPct = fv != null ? Math.min(fv * 100, 100) : null;
  const colorVar = `var(--color-${color})`;
  const inBand = ask != null && ask >= minAsk && ask <= maxAsk;
  const qualifies = inBand && edge != null && edge >= minEdge;
  const edgeCents = edge != null ? edge * 100 : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-extrabold w-10 uppercase" style={{ color: colorVar }}>
          {label}
        </span>
        <div className="flex-1 h-5 bg-bg-tertiary/50 rounded-full overflow-hidden relative border border-border/30">
          <div className="h-full" style={{ width: `${pct}%`, backgroundColor: colorVar, opacity: 0.55 }} />
          {fvPct != null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/80"
              style={{ left: `${fvPct}%` }}
              title={`Fair Value: ${fvPct.toFixed(1)}%`}
            />
          )}
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-text-primary drop-shadow-md tabular-nums">
            {ask != null ? `Ask $${ask.toFixed(2)}` : '—'}
            {fvPct != null ? ` · FV ${fvPct.toFixed(0)}%` : ''}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold w-16 text-right tabular-nums px-1 py-0.5 rounded-xs border ${
            qualifies
              ? 'bg-[#20B2AA]/20 text-[#20B2AA] border-[#20B2AA]/50'
              : edgeCents != null && edgeCents > 0
              ? 'bg-bg-tertiary text-text-secondary border-border/50'
              : 'bg-bg-tertiary/50 text-text-tertiary border-transparent'
          }`}
        >
          {edgeCents != null ? `${edgeCents >= 0 ? '+' : ''}${edgeCents.toFixed(1)}¢` : '—'}
        </span>
      </div>
    </div>
  );
}
