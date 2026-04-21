'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCountdown } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { AISignal } from '@/types/websocket';
import { Bot, TrendingUp, TrendingDown, Target, Clock, ShieldAlert, Activity } from 'lucide-react';

interface AISignalCardProps {
  signal: AISignal | null;
  className?: string;
}

export function AISignalCard({ signal, className }: AISignalCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Debug: Log when signal changes
  useEffect(() => {
    console.log('🎯 AISignalCard received signal:', signal);
  }, [signal]);

  // Update countdown every second
  useEffect(() => {
    if (!signal) {
      console.log('⚠️ No signal available for countdown');
      return;
    }

    const updateCountdown = () => {
      const remaining = formatCountdown(signal.market_end_time);
      setTimeRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [signal]);

  if (!signal) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader title="AI Prediction" />
        <CardBody>
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              Waiting for next signal...
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const isUp = signal.direction === 'UP';
  const isHold = signal.filter_passed === false;
  const DirectionIcon = isUp ? TrendingUp : TrendingDown;

  const regimeColors: Record<string, string> = {
    TRENDING: 'bg-positive/20 text-positive',
    RANGING: 'bg-accent-primary/20 text-accent-primary',
    VOLATILE: 'bg-warning/20 text-warning',
    CHOPPY: 'bg-negative/20 text-negative',
  };

  return (
    <Card className={cn('animate-slide-up', className)}>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent-primary" />
            <span>AI PREDICTION</span>
          </div>
        }
        action={
          isHold ? (
            <Badge variant="warning">HOLD</Badge>
          ) : (
            <Badge variant="success" dot>
              TRADE
            </Badge>
          )
        }
      />

      <CardBody>
        <div className="space-y-6">
          {/* Direction Display */}
          <div className="text-center">
            <div
              className={cn(
                'inline-flex items-center justify-center w-16 h-16 rounded-full mb-3',
                isHold
                  ? 'bg-bg-tertiary'
                  : isUp
                  ? 'bg-positive/20'
                  : 'bg-negative/20'
              )}
            >
              {isHold ? (
                <ShieldAlert className="h-8 w-8 text-text-tertiary" />
              ) : (
                <DirectionIcon
                  className={cn('h-8 w-8', isUp ? 'text-positive' : 'text-negative')}
                />
              )}
            </div>

            <div className="space-y-1">
              <h3
                className={cn(
                  'text-3xl font-bold',
                  isHold
                    ? 'text-text-tertiary'
                    : isUp
                    ? 'text-positive'
                    : 'text-negative'
                )}
              >
                {isHold ? 'HOLD' : signal.direction}
              </h3>
              <p className="text-sm text-text-secondary">
                {isHold ? signal.filter_reason || 'Signal filtered' : 'Market Direction'}
              </p>
            </div>
          </div>

          {/* Regime & Spread Row */}
          <div className="flex items-center justify-between">
            {signal.regime && (
              <div
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  regimeColors[signal.regime] || 'bg-bg-tertiary text-text-secondary'
                )}
              >
                {signal.regime}
              </div>
            )}
            {signal.spread != null && (
              <div className="flex items-center gap-1 text-xs text-text-secondary">
                <Activity className="h-3 w-3" />
                <span className="font-mono">
                  ${signal.spread.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Confidence */}
          <div className="text-center">
            <div className="text-4xl font-bold font-mono text-accent-primary mb-1">
              {(signal.confidence * 100).toFixed(0)}%
            </div>
            <p className="text-sm text-text-secondary">AI Confidence</p>

            {/* Confidence bar */}
            <div className="mt-3 h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  isHold
                    ? 'bg-gradient-to-r from-text-tertiary to-text-tertiary'
                    : 'bg-gradient-to-r from-accent-primary to-positive'
                )}
                style={{ width: `${signal.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Price Targets */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-tertiary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-text-tertiary" />
                <span className="text-xs text-text-tertiary uppercase">
                  Target
                </span>
              </div>
              <p className="text-lg font-mono font-semibold text-text-primary">
                {formatCurrency(signal.target_close, { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-bg-tertiary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-text-tertiary" />
                <span className="text-xs text-text-tertiary uppercase">
                  Strike
                </span>
              </div>
              <p className="text-lg font-mono font-semibold text-text-primary">
                {formatCurrency(signal.strike_price, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-accent-muted rounded-lg p-4 border border-accent-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-primary" />
                <span className="text-sm text-text-secondary">
                  Closes in
                </span>
              </div>
              <span className="text-lg font-mono font-bold text-accent-primary">
                {timeRemaining}
              </span>
            </div>
          </div>

          {/* Market Info */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Market</span>
              <span className="text-text-secondary font-mono">
                {signal.market_slug.split('-').slice(0, 2).join('-').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Price Source</span>
              <span className="text-text-secondary">
                {signal.price_source?.replace(/_/g, ' ') || 'N/A'}
              </span>
            </div>
            {signal.relative_spread != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">Rel. Spread</span>
                <span className="text-text-secondary font-mono">
                  {(signal.relative_spread * 100).toFixed(4)}%
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button variant="outlined" fullWidth>
            View Market Details
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
