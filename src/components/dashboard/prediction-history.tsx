'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatTimeAgo } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Target, CheckCircle, XCircle, Clock } from 'lucide-react';
import { predictionApi } from '@/lib/api';
import type { Prediction, PredictionStats } from '@/types/prediction';

interface PredictionHistoryProps {
  className?: string;
}

export function PredictionHistory({ className }: PredictionHistoryProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<PredictionStats>({
    total: 0,
    resolved: 0,
    wins: 0,
    losses: 0,
    winRate: '0'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await predictionApi.getHistory({ limit: 10 });
      setPredictions(data.predictions);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch prediction history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader title="Prediction History" />
        <CardBody>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-bg-tertiary rounded-lg animate-pulse" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader
        title="Prediction History"
        action={
          stats.wins + stats.losses > 0 && (
            <Badge variant={parseFloat(stats.winRate) >= 50 ? 'success' : 'error'}>
              {stats.winRate}% Win Rate
            </Badge>
          )
        }
      />

      <CardBody>
        {predictions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No predictions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.map((pred) => {
              const isUp = pred.direction === 'UP';
              const isWin = pred.outcome === 'WIN';
              const isLoss = pred.outcome === 'LOSS';
              const isPending = pred.outcome === 'PENDING';

              const DirectionIcon = isUp ? TrendingUp : TrendingDown;
              const OutcomeIcon = isWin ? CheckCircle : isLoss ? XCircle : Clock;

              return (
                <div
                  key={pred._id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    isPending && 'bg-bg-tertiary border-border',
                    isWin && 'bg-positive/10 border-positive/30',
                    isLoss && 'bg-negative/10 border-negative/30'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    {/* Direction */}
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          isUp ? 'bg-positive/20' : 'bg-negative/20'
                        )}
                      >
                        <DirectionIcon
                          className={cn('h-4 w-4', isUp ? 'text-positive' : 'text-negative')}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {pred.direction}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {(pred.confidence * 100).toFixed(0)}% confidence
                        </p>
                      </div>
                    </div>

                    {/* Outcome */}
                    <div className="flex items-center gap-2">
                      <OutcomeIcon
                        className={cn(
                          'h-5 w-5',
                          isWin && 'text-positive',
                          isLoss && 'text-negative',
                          isPending && 'text-text-tertiary'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isWin && 'text-positive',
                          isLoss && 'text-negative',
                          isPending && 'text-text-tertiary'
                        )}
                      >
                        {pred.outcome}
                      </span>
                    </div>
                  </div>

                  {/* Price Details */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-text-tertiary mb-1">Strike</p>
                      <p className="font-mono font-semibold text-text-primary">
                        {formatCurrency(pred.strike_price, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-tertiary mb-1">Target</p>
                      <p className="font-mono font-semibold text-text-primary">
                        {formatCurrency(pred.target_close, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-tertiary mb-1">Actual</p>
                      <p
                        className={cn(
                          'font-mono font-semibold',
                          pred.actual_close && pred.actual_direction
                            ? pred.actual_direction === 'UP'
                              ? 'text-positive'
                              : 'text-negative'
                            : 'text-text-primary'
                        )}
                      >
                        {pred.actual_close
                          ? formatCurrency(pred.actual_close, { maximumFractionDigits: 0 })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Resolution Details (if resolved) */}
                  {!isPending && pred.actual_close && (
                    <div className="mt-3 p-3 rounded-md bg-bg-secondary/50">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-text-tertiary">Market moved</span>
                          <span
                            className={cn(
                              'font-semibold',
                              pred.actual_direction === 'UP' ? 'text-positive' : 'text-negative'
                            )}
                          >
                            {pred.actual_direction}
                          </span>
                          <span className="text-text-tertiary">from strike</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-text-tertiary">
                            {Math.abs(
                              ((pred.actual_close - pred.strike_price) / pred.strike_price) * 100
                            ).toFixed(2)}%
                          </span>
                          {pred.actual_direction === 'UP' ? (
                            <TrendingUp className="h-3 w-3 text-positive" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-negative" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-text-tertiary">
                      {isPending
                        ? pred.createdAt ? `Created ${formatTimeAgo(pred.createdAt)}` : 'Pending...'
                        : pred.resolved_at
                        ? `Resolved ${formatTimeAgo(pred.resolved_at)}`
                        : pred.createdAt ? formatTimeAgo(pred.createdAt) : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
