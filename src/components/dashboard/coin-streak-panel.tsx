'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/socket-context';
import { executionApi } from '@/lib/api';
import { TrendingUp, TrendingDown, Radio, FlaskConical } from 'lucide-react';
import type { PositionInfo, CoinStreakState } from '@/lib/api/execution';
import { cn } from '@/lib/utils/cn';

const MARKET_META: { id: string; asset: string; window: string }[] = [
  { id: 'btc-5m', asset: 'BTC', window: '5m' },
  { id: 'btc-15m', asset: 'BTC', window: '15m' },
  { id: 'eth-5m', asset: 'ETH', window: '5m' },
  { id: 'eth-15m', asset: 'ETH', window: '15m' },
  { id: 'sol-5m', asset: 'SOL', window: '5m' },
  { id: 'sol-15m', asset: 'SOL', window: '15m' },
  { id: 'doge-5m', asset: 'DOGE', window: '5m' },
  { id: 'doge-15m', asset: 'DOGE', window: '15m' },
];

const COIN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#9945FF',
  DOGE: '#C2A633',
};

const MARKET_ORDER = MARKET_META.map(m => m.id);

function formatPrice(asset: string, price: number): string {
  if (asset === 'DOGE') return `$${price.toFixed(4)}`;
  if (asset === 'SOL') return `$${price.toFixed(2)}`;
  if (asset === 'ETH') return `$${price.toFixed(2)}`;
  return `$${price.toFixed(2)}`;
}

export function CoinStreakPanel() {
  const { socket } = useSocket();
  const [streaks, setStreaks] = useState<Record<string, CoinStreakState>>({});
  const [probes, setProbes] = useState<Record<string, PositionInfo>>({});
  const [live, setLive] = useState(false);
  const streaksRef = useRef(streaks);
  streaksRef.current = streaks;
  const probesRef = useRef(probes);
  probesRef.current = probes;

  // Initial hydrate: streaks + open probe positions
  useEffect(() => {
    executionApi
      .getMidMarketStats()
      .then((stats) => {
        const nextStreaks: Record<string, CoinStreakState> = {};
        for (const id of MARKET_ORDER) {
          if (stats.streaks?.[id]) {
            nextStreaks[id] = { streak: stats.streaks[id].streak || [], paused: !!stats.streaks[id].paused };
          }
        }
        setStreaks(nextStreaks);

        const nextProbes: Record<string, PositionInfo> = {};
        const pos = stats.positions || {};
        for (const mt of MARKET_ORDER) {
          const arr = Array.isArray(pos[mt]) ? pos[mt] : [];
          const probe = arr.find((p: any) => p.probe === true);
          if (probe) nextProbes[mt] = probe;
        }
        setProbes(nextProbes);
      })
      .catch(() => {});
  }, []);

  // Live socket updates
  useEffect(() => {
    if (!socket) return;

    const onStreak = (data: any) => {
      const mt = data?.market_type;
      if (!mt || !MARKET_ORDER.includes(mt)) return;
      setLive(true);
      setStreaks((prev) => ({
        ...prev,
        [mt]: { streak: Array.isArray(data.streak) ? data.streak : [], paused: data.paused === true },
      }));
    };

    const onProbeEntry = (data: any) => {
      const mt = data?.market_type;
      if (!mt || !MARKET_ORDER.includes(mt)) return;
      setLive(true);
      const info: PositionInfo = {
        trade_id: data.trade_id || `probe_${mt}`,
        direction: data.direction,
        entry_price: data.entry_price,
        num_shares: data.num_shares,
        probe: true,
        stop_loss_price: data.stop_price,
      };
      setProbes((prev) => {
        const existing = prev[mt];
        if (existing && existing.entry_price === info.entry_price) return prev;
        return { ...prev, [mt]: info };
      });
    };

    const onProbeClose = (data: any) => {
      const mt = data?.market_type;
      if (!mt || !MARKET_ORDER.includes(mt)) return;
      setLive(true);
      setProbes((prev) => {
        const existing = prev[mt];
        if (!existing) return prev;
        if (data.trade_id && existing.trade_id === data.trade_id) {
          const next = { ...prev };
          delete next[mt];
          return next;
        }
        // fallback: match by direction+entry if trade_id missing
        if (data.direction === existing.direction && data.entry_price === existing.entry_price) {
          const next = { ...prev };
          delete next[mt];
          return next;
        }
        return prev;
      });
    };

    socket.on('mid_market_streak', onStreak);
    socket.on('mid_market_probe_entry', onProbeEntry);
    socket.on('mid_market_probe_close', onProbeClose);
    return () => {
      socket.off('mid_market_streak', onStreak);
      socket.off('mid_market_probe_entry', onProbeEntry);
      socket.off('mid_market_probe_close', onProbeClose);
    };
  }, [socket]);

  return (
    <div className="bg-[#0F1215] border border-[#1B2026]">
      <div className="flex items-center justify-between px-3 py-2 bg-[#16191E]/80 border-b border-[#1B2026]">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-3.5 w-3.5 text-[#20B2AA]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E1E4E8]">
            Coin Streak &amp; Probes
          </span>
        </div>
        <span
          className={cn(
            'flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-xs border',
            live ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30' : 'bg-[#586069]/15 text-[#586069] border-[#586069]/30'
          )}
        >
          <Radio className="h-2.5 w-2.5" />
          {live ? 'LIVE' : '···'}
        </span>
      </div>

      <div className="p-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MARKET_META.map((m) => {
          const s = streaksRef.current[m.id];
          const streak = s?.streak || [];
          const paused = s?.paused ?? false;
          const probe = probesRef.current[m.id];
          const color = COIN_COLORS[m.asset] || '#8B949E';

          return (
            <div
              key={m.id}
              className={cn(
                'border px-2 py-1.5 min-h-[58px]',
                paused
                  ? 'border-[#E55353]/40 bg-[#E55353]/5'
                  : probe
                    ? 'border-[#20B2AA]/40 bg-[#20B2AA]/5'
                    : 'border-[#1B2026] bg-[#080A0C]'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-[10px] uppercase" style={{ color }}>
                  {m.asset} {m.window}
                </span>
                <div className="flex gap-0.5">
                  {streak.slice()
                    .slice(0, 6)
                    .map((r, i) => (
                      <span
                        key={i}
                        className={cn(
                          'w-1.5 h-2 rounded-[1px]',
                          r === 'W' ? 'bg-[#20B2AA]' : 'bg-[#E55353]'
                        )}
                      />
                    ))}
                  {streak.length === 0 && <span className="text-[8px] text-[#586069]">—</span>}
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between gap-1">
                {probe ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#20B2AA]">
                    <TrendingUp className="h-3 w-3" />
                    PROBE {probe.direction === 'DOWN' && <TrendingDown className="h-3 w-3 -ml-1" />}{' '}
                    {formatPrice(m.asset, probe.entry_price)}
                  </span>
                ) : (
                  <span className="text-[9px] text-[#586069] uppercase">no probe</span>
                )}
                {paused ? (
                  <span className="text-[9px] font-bold uppercase text-[#E55353] border border-[#E55353]/30 bg-[#E55353]/10 px-1 py-0.5 rounded-xs">
                    paused
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase text-[#20B2AA] border border-[#20B2AA]/30 bg-[#20B2AA]/10 px-1 py-0.5 rounded-xs">
                    live
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-1.5 border-t border-[#1B2026] bg-[#16191E]/40">
        <div className="flex items-center gap-3 text-[9px] text-[#8B949E] uppercase">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-2 rounded-[1px] bg-[#20B2AA]" /> win
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-2 rounded-[1px] bg-[#E55353]" /> loss
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#20B2AA]" /> probe open
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E55353]" /> paused
          </span>
        </div>
      </div>
    </div>
  );
}