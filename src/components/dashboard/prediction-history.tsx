'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatTimeAgo } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 25;

  useEffect(() => {
    fetchHistory(false);
  }, []);

  const fetchHistory = async (append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const currentCount = append ? predictions.length : 0;

    try {
      const data = await predictionApi.getHistory({
        limit: pageSize,
        skip: currentCount
      });

      setPredictions((prev) => (append ? [...prev, ...data.predictions] : data.predictions));
      setStats(data.stats);
      setTotalCount(data.pagination.total);

      const nextCount = currentCount + data.predictions.length;
      setHasMore(nextCount < data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch prediction history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchHistory(true);
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
            <ShieldAlert className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No predictions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-text-tertiary uppercase tracking-wide">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium">Time</th>
                    <th className="px-3 py-2 text-left font-medium">Signal</th>
                    <th className="px-3 py-2 text-right font-medium">Confidence</th>
                    <th className="px-3 py-2 text-right font-medium">Strike</th>
                    <th className="px-3 py-2 text-right font-medium">Target</th>
                    <th className="px-3 py-2 text-right font-medium">Outcome</th>
                    <th className="px-3 py-2 text-right font-medium">Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {predictions.map((pred) => {
                    const isHold = pred.filter_passed === false;
                    const displayDirection = isHold ? 'HOLD' : pred.direction;
                    const confidence = pred.confidence ?? Math.max(pred.prob_up, 1 - pred.prob_up);
                    const outcome = pred.outcome || 'PENDING';
                    const timeValue = pred.createdAt || pred.timestamp_trigger;
                    const DirectionIcon = displayDirection === 'UP'
                      ? TrendingUp
                      : displayDirection === 'DOWN'
                      ? TrendingDown
                      : ShieldAlert;
                    const OutcomeIcon = outcome === 'WIN'
                      ? CheckCircle
                      : outcome === 'LOSS'
                      ? XCircle
                      : Clock;

                    return (
                      <tr
                        key={pred._id}
                        className={cn(
                          'transition-colors',
                          isHold && 'bg-bg-tertiary/40 text-text-tertiary'
                        )}
                      >
                        <td className="px-3 py-3 text-xs text-text-tertiary">
                          {timeValue ? formatTimeAgo(timeValue) : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'h-7 w-7 rounded-full flex items-center justify-center',
                                displayDirection === 'UP' && 'bg-positive/20',
                                displayDirection === 'DOWN' && 'bg-negative/20',
                                displayDirection === 'HOLD' && 'bg-bg-tertiary'
                              )}
                            >
                              <DirectionIcon
                                className={cn(
                                  'h-4 w-4',
                                  displayDirection === 'UP' && 'text-positive',
                                  displayDirection === 'DOWN' && 'text-negative',
                                  displayDirection === 'HOLD' && 'text-text-tertiary'
                                )}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">
                                {displayDirection}
                              </p>
                              {pred.regime && (
                                <p className="text-xs text-text-tertiary">{pred.regime}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-text-primary">
                          {(confidence * 100).toFixed(0)}%
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-text-primary">
                          {formatCurrency(pred.strike_price, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-text-primary">
                          {formatCurrency(pred.target_close, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <OutcomeIcon
                              className={cn(
                                'h-4 w-4',
                                outcome === 'WIN' && 'text-positive',
                                outcome === 'LOSS' && 'text-negative',
                                outcome === 'PENDING' && 'text-text-tertiary'
                              )}
                            />
                            <span
                              className={cn(
                                'text-xs font-medium',
                                outcome === 'WIN' && 'text-positive',
                                outcome === 'LOSS' && 'text-negative',
                                outcome === 'PENDING' && 'text-text-tertiary'
                              )}
                            >
                              {outcome}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Badge
                            variant={isHold ? 'warning' : 'success'}
                            size="sm"
                            title={isHold ? pred.filter_reason || 'Filtered' : 'Passed filters'}
                          >
                            {isHold ? 'HELD' : 'TRADED'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-text-tertiary">
              <span>
                Showing {predictions.length} of {totalCount} predictions
              </span>
              {hasMore && (
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
