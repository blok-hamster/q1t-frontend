'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCountdown } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { AISignal } from '@/types/websocket';
import { Bot, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';

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
  const DirectionIcon = isUp ? TrendingUp : TrendingDown;

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
          <Badge variant="info" dot>
            Live
          </Badge>
        }
      />

      <CardBody>
        <div className="space-y-6">
          {/* Direction Display */}
          <div className="text-center">
            <div
              className={cn(
                'inline-flex items-center justify-center w-16 h-16 rounded-full mb-3',
                isUp ? 'bg-positive/20' : 'bg-negative/20'
              )}
            >
              <DirectionIcon
                className={cn('h-8 w-8', isUp ? 'text-positive' : 'text-negative')}
              />
            </div>

            <div className="space-y-1">
              <h3
                className={cn(
                  'text-3xl font-bold',
                  isUp ? 'text-positive' : 'text-negative'
                )}
              >
                {signal.direction}
              </h3>
              <p className="text-sm text-text-secondary">
                Market Direction
              </p>
            </div>
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
                className="h-full bg-gradient-to-r from-accent-primary to-positive transition-all duration-500"
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
