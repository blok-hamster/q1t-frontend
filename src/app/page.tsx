'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { predictionApi } from '@/lib/api';
import { formatCurrency, formatTimeAgo } from '@/lib/utils/format';
import type { Prediction } from '@/types/prediction';
import {
  Bot,
  Brain,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowRight,
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
        const data = await predictionApi.getHistory({ limit: 6 });
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
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-accent-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-72 w-72 rounded-full bg-positive/10 blur-[140px]" />

      <header className="relative z-10 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image
                  src="/logo.svg"
                  alt="q1t Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-sm uppercase tracking-[0.3em] text-text-tertiary">
                {APP_NAME}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-64px)] py-10">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <section className="flex h-full flex-col justify-between gap-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-muted px-4 py-2 text-xs uppercase tracking-[0.3em] text-accent-primary">
                <Bot className="h-4 w-4" />
                AI Prediction Engine
              </div>

              <h1 className="text-5xl leading-tight font-bold sm:text-6xl">
                Futuristic Bitcoin
                <span className="block text-accent-primary">Signal Intelligence</span>
              </h1>

              <p className="max-w-xl text-lg text-text-secondary">
                Our AI Engine streams high-resolution market structure, executes
                asymmetry-aware fades, and keeps every prediction transparent in
                real time. This is not a bot. It is a live decision system.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href={ROUTES.REGISTER}>
                  <Button size="lg" variant="primary">
                    Launch the Engine
                  </Button>
                </Link>
                <Link href={ROUTES.DASHBOARD}>
                  <Button size="lg" variant="outlined">
                    Watch Live Signals
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <ArrowRight className="h-3 w-3" />
                  Real-time streaming predictions
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card padding="lg" className="border border-accent-primary/20 bg-bg-secondary/60">
                <Brain className="h-6 w-6 text-accent-primary mb-3" />
                <p className="text-sm font-semibold">Trajectory Intelligence</p>
                <p className="text-xs text-text-tertiary">Monte Carlo slope consensus</p>
              </Card>
              <Card padding="lg" className="border border-positive/20 bg-bg-secondary/60">
                <Shield className="h-6 w-6 text-positive mb-3" />
                <p className="text-sm font-semibold">Filter Discipline</p>
                <p className="text-xs text-text-tertiary">Risk-gated trade execution</p>
              </Card>
              <Card padding="lg" className="border border-neutral/20 bg-bg-secondary/60">
                <Zap className="h-6 w-6 text-neutral mb-3" />
                <p className="text-sm font-semibold">5-Minute Cadence</p>
                <p className="text-xs text-text-tertiary">High-frequency structure capture</p>
              </Card>
            </div>
          </section>

          <section className="flex h-full flex-col gap-4">
            <Card padding="lg" className="flex h-full flex-col border border-border/60 bg-bg-secondary/70">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary">Prediction Ledger</p>
                  <h2 className="text-xl font-semibold mt-2">Recent Engine Calls</h2>
                </div>
                <Badge variant="success" size="sm">
                  Filter Win Rate: {filteredWinRateLabel}
                </Badge>
              </div>

              <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-border/40">
                <table className="min-w-full text-sm">
                  <thead className="bg-bg-tertiary/60 text-xs text-text-tertiary uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Time</th>
                      <th className="px-3 py-2 text-left font-medium">Signal</th>
                      <th className="px-3 py-2 text-right font-medium">Strike</th>
                      <th className="px-3 py-2 text-right font-medium">Target</th>
                      <th className="px-3 py-2 text-right font-medium">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-xs text-text-tertiary">
                          Loading predictions...
                        </td>
                      </tr>
                    ) : (
                      predictions.map((pred) => {
                        const isHold = pred.filter_passed === false;
                        const directionLabel = isHold ? 'HOLD' : pred.direction;
                        const DirectionIcon = directionLabel === 'UP'
                          ? TrendingUp
                          : directionLabel === 'DOWN'
                          ? TrendingDown
                          : Shield;

                        return (
                          <tr key={pred._id} className="text-text-secondary">
                            <td className="px-3 py-2 text-xs text-text-tertiary">
                              {pred.createdAt ? formatTimeAgo(pred.createdAt) : '--'}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <DirectionIcon
                                  className={
                                    directionLabel === 'UP'
                                      ? 'h-4 w-4 text-positive'
                                      : directionLabel === 'DOWN'
                                      ? 'h-4 w-4 text-negative'
                                      : 'h-4 w-4 text-text-tertiary'
                                  }
                                />
                                <span className="text-sm font-semibold text-text-primary">
                                  {directionLabel}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-text-primary">
                              {formatCurrency(pred.strike_price, { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-text-primary">
                              {formatCurrency(pred.target_close, { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Badge variant={pred.outcome === 'WIN' ? 'success' : pred.outcome === 'LOSS' ? 'error' : 'default'} size="sm">
                                {pred.outcome || 'PENDING'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-text-tertiary">
                <span>{isDemo ? 'Demo data (login for live ledger)' : 'Live prediction stream'}</span>
                <Link href={ROUTES.DASHBOARD} className="text-accent-primary hover:text-accent-primary/80">
                  View full history
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </main>

      <footer className="relative z-10 py-12 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-text-tertiary">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
