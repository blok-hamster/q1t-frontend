'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { Brain, Zap, ShieldAlert } from 'lucide-react';
import { predictionApi } from '@/lib/api';
import type { AccuracyStats } from '@/types/prediction';

interface AccuracyComparisonProps {
  className?: string;
}

export function AccuracyComparison({ className }: AccuracyComparisonProps) {
  const [stats, setStats] = useState<AccuracyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const data = await predictionApi.getAccuracy();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch accuracy stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader title="Accuracy Comparison" />
        <CardBody>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-bg-tertiary rounded-lg animate-pulse" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!stats) return null;

  const rows = [
    {
      label: 'All AI Signals',
      icon: Brain,
      correct: stats.ai.correct,
      total: stats.ai.total,
      winRate: stats.ai.winRate,
      color: 'text-accent-primary',
      bgColor: 'bg-accent-primary/10',
    },
    {
      label: 'Filtered Trades',
      icon: Zap,
      correct: stats.combined.correct,
      total: stats.combined.total,
      winRate: stats.combined.winRate,
      color: 'text-positive',
      bgColor: 'bg-positive/10',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader
        title="Filtered Performance"
        action={
          stats.combined.total > 0 && (
            <Badge variant={parseFloat(stats.combined.winRate) >= 50 ? 'success' : 'error'} size="sm">
              {stats.combined.total} traded
            </Badge>
          )
        }
      />

      <CardBody>
        <div className="space-y-3">
          {rows.map((row) => {
            const rate = parseFloat(row.winRate);
            return (
              <div
                key={row.label}
                className={cn('p-3 rounded-lg border border-border', row.bgColor)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <row.icon className={cn('h-4 w-4', row.color)} />
                    <span className="text-sm font-medium text-text-primary">
                      {row.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary">
                      {row.correct}/{row.total}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-bold font-mono',
                        rate >= 55 ? 'text-positive' :
                        rate >= 50 ? 'text-text-primary' :
                        'text-negative'
                      )}
                    >
                      {row.winRate}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      rate >= 55 ? 'bg-positive' :
                      rate >= 50 ? 'bg-accent-primary' :
                      'bg-negative'
                    )}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Hold Analysis */}
          {stats.holdAnalysis.total > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-bg-tertiary border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-text-tertiary" />
                <span className="text-sm font-medium text-text-primary">
                  Filter Analysis
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-text-tertiary">Correctly Held</p>
                  <p className="font-mono font-semibold text-positive">
                    {stats.holdAnalysis.wouldHaveLost} losses avoided
                  </p>
                </div>
                <div>
                  <p className="text-text-tertiary">Missed Wins</p>
                  <p className="font-mono font-semibold text-negative">
                    {stats.holdAnalysis.wouldHaveWon} wins missed
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-text-tertiary">Filter savings rate</span>
                <span
                  className={cn(
                    'font-mono font-semibold',
                    parseFloat(stats.holdAnalysis.filterSavingsRate) >= 50
                      ? 'text-positive'
                      : 'text-negative'
                  )}
                >
                  {stats.holdAnalysis.filterSavingsRate}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
