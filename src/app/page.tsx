'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { predictionApi } from '@/lib/api';
import { formatCurrency, formatTimeAgo } from '@/lib/utils/format';
import type { Prediction } from '@/types/prediction';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  ShieldCheck,
  Clock,
  Terminal,
} from 'lucide-react';

const demoPredictions: Prediction[] = [
  {
    _id: 'demo-1',
    timestamp_trigger: '',
    timestamp_target: '',
    market_start_time: '',
    market_end_time: '',
    direction: 'UP',
    confidence: 0.72,
    prob_up: 0.72,
    strike_price: 70612,
    target_close: 70940,
    price_source: 'binance_spot',
    market_slug: 'btc-usdt-5m',
    filter_passed: true,
    outcome: 'WIN',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    _id: 'demo-2',
    timestamp_trigger: '',
    timestamp_target: '',
    market_start_time: '',
    market_end_time: '',
    direction: 'DOWN',
    confidence: 0.68,
    prob_up: 0.32,
    strike_price: 70982,
    target_close: 70610,
    price_source: 'binance_spot',
    market_slug: 'btc-usdt-5m',
    filter_passed: true,
    outcome: 'LOSS',
    createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString()
  },
  {
    _id: 'demo-3',
    timestamp_trigger: '',
    timestamp_target: '',
    market_start_time: '',
    market_end_time: '',
    direction: 'UP',
    confidence: 0.61,
    prob_up: 0.61,
    strike_price: 70210,
    target_close: 70490,
    price_source: 'binance_spot',
    market_slug: 'btc-usdt-5m',
    filter_passed: false,
    outcome: 'WIN',
    createdAt: new Date(Date.now() - 1000 * 60 * 44).toISOString()
  },
  {
    _id: 'demo-4',
    timestamp_trigger: '',
    timestamp_target: '',
    market_start_time: '',
    market_end_time: '',
    direction: 'DOWN',
    confidence: 0.77,
    prob_up: 0.23,
    strike_price: 71135,
    target_close: 70830,
    price_source: 'binance_spot',
    market_slug: 'btc-usdt-5m',
    filter_passed: true,
    outcome: 'WIN',
    createdAt: new Date(Date.now() - 1000 * 60 * 62).toISOString()
  },
  {
    _id: 'demo-5',
    timestamp_trigger: '',
    timestamp_target: '',
    market_start_time: '',
    market_end_time: '',
    direction: 'UP',
    confidence: 0.58,
    prob_up: 0.58,
    strike_price: 69940,
    target_close: 70200,
    price_source: 'binance_spot',
    market_slug: 'btc-usdt-5m',
    filter_passed: true,
    outcome: 'PENDING',
    createdAt: new Date(Date.now() - 1000 * 60 * 88).toISOString()
  },
  {
    _id: 'demo-6',
    timestamp_trigger: '',
    timestamp_target: '',
    market_start_time: '',
    market_end_time: '',
    direction: 'DOWN',
    confidence: 0.69,
    prob_up: 0.31,
    strike_price: 71320,
    target_close: 70990,
    price_source: 'binance_spot',
    market_slug: 'btc-usdt-5m',
    filter_passed: true,
    outcome: 'WIN',
    createdAt: new Date(Date.now() - 1000 * 60 * 104).toISOString()
  }
];

export default function LandingPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        const data = await predictionApi.getHistory({ limit: 8 });
        setPredictions(data.predictions);
        setIsDemo(false);
      } catch (error) {
        setPredictions(demoPredictions);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, []);

  const filteredWinRate = useMemo(() => {
    const traded = predictions.filter((pred) => pred.filter_passed !== false);
    const resolved = traded.filter((pred) => pred.outcome && pred.outcome !== 'PENDING');
    const wins = resolved.filter((pred) => pred.outcome === 'WIN').length;
    if (resolved.length === 0) return '--';
    return ((wins / resolved.length) * 100).toFixed(1);
  }, [predictions]);

  const filteredWinRateLabel = filteredWinRate === '--' ? filteredWinRate : `${filteredWinRate}%`;

  return (
    <div className="min-h-screen bg-[#080A0C] text-[#E1E4E8] font-sans">
      {/* Top Header */}
      <header className="border-b border-[#1B2026] bg-[#0F1215] select-none">
        <div className="max-w-[1600px] mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-6 w-6">
              <Image
                src="/logo.svg"
                alt="q1t Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-mono text-xs font-bold tracking-[0.15em] text-[#E1E4E8]">
              Q1T <span className="text-[#586069] mx-1">/</span> BITCOIN SIGNAL TREASURY
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase text-[#8B949E] bg-[#16191E] px-2.5 py-1 border border-[#1B2026]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20B2AA] animate-pulse" />
              <span className="text-[#20B2AA]">• LIVE STREAM</span>
            </div>
            <Link href={ROUTES.LOGIN}>
              <button className="px-3 py-1 font-mono text-xs text-[#8B949E] hover:text-[#E1E4E8] transition-colors border border-transparent">
                LOG IN
              </button>
            </Link>
            <Link href={ROUTES.REGISTER}>
              <button className="px-3.5 py-1 font-mono text-xs font-semibold text-[#080A0C] bg-[#20B2AA] hover:bg-[#1CA099] transition-colors rounded-xs">
                LAUNCH ENGINE
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Terminal Viewport */}
      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        
        {/* Top 4-Metric Meridian Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#0F1215] border border-[#1B2026] p-3.5">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#586069]">
              CORE STRATEGY
            </p>
            <p className="text-xl font-mono font-bold text-[#E1E4E8] mt-1">
              MID-MARKET 5M
            </p>
            <p className="text-[11px] font-mono text-[#20B2AA] mt-0.5">
              ACTIVE WINDOW SIGNAL
            </p>
          </div>

          <div className="bg-[#0F1215] border border-[#1B2026] p-3.5">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#586069]">
              FILTER WIN RATE
            </p>
            <p className="text-xl font-mono font-bold text-[#20B2AA] mt-1 tabular-nums">
              {filteredWinRateLabel}
            </p>
            <p className="text-[11px] font-mono text-[#8B949E] mt-0.5">
              CONFIDENCE GATED EXECUTION
            </p>
          </div>

          <div className="bg-[#0F1215] border border-[#1B2026] p-3.5">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#586069]">
              DECISION CADENCE
            </p>
            <p className="text-xl font-mono font-bold text-[#E1E4E8] mt-1">
              5-MIN SLOPES
            </p>
            <p className="text-[11px] font-mono text-[#8B949E] mt-0.5">
              MONTE CARLO CONSENSUS
            </p>
          </div>

          <div className="bg-[#0F1215] border border-[#1B2026] p-3.5">
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#586069]">
              EXECUTION PIPELINE
            </p>
            <p className="text-xl font-mono font-bold text-[#20B2AA] mt-1">
              POLYMARKET LIVE
            </p>
            <p className="text-[11px] font-mono text-[#8B949E] mt-0.5">
              AUTO-CLAIM & SETTLEMENT
            </p>
          </div>
        </div>

        {/* 2-Column Split: System Overview vs Live Transaction Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: System Overview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0F1215] border border-[#1B2026] p-6 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold text-[#20B2AA] bg-[#20B2AA]/10 border border-[#20B2AA]/30 uppercase">
                  <Terminal className="h-3 w-3" />
                  REAL-TIME BITCOIN INTELLIGENCE
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E1E4E8]">
                  PRECISION SIGNAL EXECUTION SYSTEM
                </h1>
                <p className="text-xs font-mono text-[#8B949E] leading-relaxed">
                  Engineered strictly around high-resolution BTC market structure. Filters signals via Monte Carlo slope consensus and auto-executes qualified predictions directly into prediction market positions.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link href={ROUTES.REGISTER}>
                  <button className="px-4 py-2 text-xs font-mono font-bold text-[#080A0C] bg-[#20B2AA] hover:bg-[#1CA099] transition-colors rounded-xs flex items-center gap-2">
                    LAUNCH TERMINAL <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
                <Link href={ROUTES.DASHBOARD}>
                  <button className="px-4 py-2 text-xs font-mono text-[#8B949E] hover:text-[#E1E4E8] bg-[#16191E] hover:bg-[#16191E]/80 border border-[#1B2026] transition-colors">
                    WATCH LIVE SIGNALS
                  </button>
                </Link>
              </div>
            </div>

            {/* Technical Feature Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#0F1215] border border-[#1B2026] p-3.5 space-y-1">
                <Activity className="h-4 w-4 text-[#20B2AA]" />
                <p className="text-xs font-mono font-bold text-[#E1E4E8]">TRAJECTORY</p>
                <p className="text-[10px] font-mono text-[#586069]">5m slope consensus</p>
              </div>
              <div className="bg-[#0F1215] border border-[#1B2026] p-3.5 space-y-1">
                <ShieldCheck className="h-4 w-4 text-[#20B2AA]" />
                <p className="text-xs font-mono font-bold text-[#E1E4E8]">DISCIPLINE</p>
                <p className="text-[10px] font-mono text-[#586069]">Risk-gated execution</p>
              </div>
              <div className="bg-[#0F1215] border border-[#1B2026] p-3.5 space-y-1">
                <Clock className="h-4 w-4 text-[#D99B00]" />
                <p className="text-xs font-mono font-bold text-[#E1E4E8]">CADENCE</p>
                <p className="text-[10px] font-mono text-[#586069]">High frequency 5m</p>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Prediction Ledger (7 cols) - Meridian Style Table */}
          <div className="lg:col-span-7">
            <div className="bg-[#0F1215] border border-[#1B2026] flex flex-col h-full">
              
              {/* Table Header Banner */}
              <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]/60">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#586069]">
                    PREDICTION LEDGER
                  </p>
                  <h2 className="text-sm font-mono font-semibold text-[#E1E4E8] mt-0.5">
                    RECENT ENGINE CALLS
                  </h2>
                </div>
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase text-[#20B2AA] bg-[#20B2AA]/10 border border-[#20B2AA]/20">
                  WIN RATE: {filteredWinRateLabel}
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#16191E] border-b border-[#1B2026] text-[10px] font-mono text-[#586069] uppercase tracking-[0.1em]">
                      <th className="px-3 py-2">TIME</th>
                      <th className="px-3 py-2">SIGNAL</th>
                      <th className="px-3 py-2 text-right">STRIKE</th>
                      <th className="px-3 py-2 text-right">TARGET</th>
                      <th className="px-3 py-2 text-right">OUTCOME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2026]/60 font-mono text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-[#586069]">
                          Loading prediction ledger...
                        </td>
                      </tr>
                    ) : (
                      predictions.map((pred) => {
                        const isHold = pred.filter_passed === false;
                        const directionLabel = isHold ? 'HOLD' : pred.direction;

                        return (
                          <tr key={pred._id} className="hover:bg-[#16191E]/40 transition-colors">
                            <td className="px-3 py-2 text-[#8B949E]">
                              {pred.createdAt ? formatTimeAgo(pred.createdAt) : '--'}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 font-bold ${
                                directionLabel === 'UP' ? 'text-[#20B2AA]' : directionLabel === 'DOWN' ? 'text-[#E55353]' : 'text-[#8B949E]'
                              }`}>
                                {directionLabel === 'UP' && <TrendingUp className="h-3.5 w-3.5" />}
                                {directionLabel === 'DOWN' && <TrendingDown className="h-3.5 w-3.5" />}
                                {directionLabel}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-[#E1E4E8]">
                              {formatCurrency(pred.strike_price, { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-[#E1E4E8]">
                              {formatCurrency(pred.target_close, { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-xs border ${
                                pred.outcome === 'WIN'
                                  ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                                  : pred.outcome === 'LOSS'
                                  ? 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30'
                                  : 'bg-[#D99B00]/15 text-[#D99B00] border-[#D99B00]/30'
                              }`}>
                                {pred.outcome || 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-3 border-t border-[#1B2026] flex items-center justify-between text-[11px] font-mono text-[#586069] bg-[#16191E]/30 mt-auto">
                <span>{isDemo ? 'DEMO STREAM (LOG IN FOR LIVE LEDGER)' : 'REAL-TIME SIGNAL FEED'}</span>
                <Link href={ROUTES.DASHBOARD} className="text-[#20B2AA] hover:underline flex items-center gap-1">
                  VIEW FULL HISTORY <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-[#1B2026] bg-[#0F1215] py-4 mt-12">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px] text-[#586069]">
          <span>© {new Date().getFullYear()} {APP_NAME}. SYSTEM v2.4</span>
          <span>SOURCES: BINANCE SPOT • POLYMARKET • MID-MARKET 5M</span>
        </div>
      </footer>
    </div>
  );
}
