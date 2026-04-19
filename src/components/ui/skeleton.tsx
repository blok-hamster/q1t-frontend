'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  count = 1,
  className,
  ...props
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-bg-tertiary';

  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  if (count === 1) {
    return (
      <div
        className={cn(baseClasses, variantClasses[variant], className)}
        style={style}
        {...props}
      />
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClasses, variantClasses[variant], className)}
          style={style}
          {...props}
        />
      ))}
    </>
  );
}

/**
 * Chart Skeleton
 */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Chart area */}
      <div className="relative h-[400px] bg-bg-tertiary rounded-lg overflow-hidden">
        {/* Simulated chart bars */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-1 p-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-accent-primary/20 rounded-t animate-pulse"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Time period selector */}
      <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={60} height={32} />
        ))}
      </div>
    </div>
  );
}

/**
 * Trade Card Skeleton
 */
export function TradeCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 bg-bg-secondary rounded-lg border border-border', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" width={32} height={32} />
          <div className="space-y-2">
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
        <Skeleton width={60} height={24} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Skeleton width={40} height={10} />
          <Skeleton width={80} height={14} />
        </div>
        <div className="space-y-2">
          <Skeleton width={60} height={10} />
          <Skeleton width={70} height={14} />
        </div>
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 7 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height={16} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Metric Card Skeleton
 */
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 bg-bg-secondary rounded-lg border border-border', className)}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton width={80} height={12} />
        <Skeleton variant="circle" width={32} height={32} />
      </div>
      <Skeleton width={100} height={24} className="mb-2" />
      <Skeleton width={120} height={12} />
    </div>
  );
}

/**
 * Transaction Skeleton
 */
export function TransactionSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 bg-bg-tertiary rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="space-y-2">
          <Skeleton width={120} height={14} />
          <Skeleton width={180} height={12} />
          <Skeleton width={100} height={10} />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton width={100} height={14} />
        <Skeleton width={60} height={12} />
        <Skeleton width={120} height={10} />
      </div>
    </div>
  );
}

/**
 * AI Signal Card Skeleton
 */
export function AISignalSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 bg-bg-secondary rounded-lg border border-border', className)}>
      <Skeleton width={120} height={12} className="mb-4" />
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circle" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width={80} height={24} />
          <Skeleton width={140} height={16} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton width={80} height={12} />
          <Skeleton width={120} height={16} />
        </div>
        <div className="flex justify-between">
          <Skeleton width={80} height={12} />
          <Skeleton width={120} height={16} />
        </div>
        <Skeleton width="100%" height={10} className="mt-4" />
      </div>
      <Skeleton width="100%" height={36} className="mt-6" />
    </div>
  );
}

/**
 * Balance Card Skeleton
 */
export function BalanceCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 bg-bg-secondary rounded-lg border border-border', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={60} height={14} />
        <Skeleton variant="circle" width={32} height={32} />
      </div>
      <Skeleton width={140} height={32} className="mb-2" />
      <Skeleton width={100} height={14} />
    </div>
  );
}

/**
 * Page Header Skeleton
 */
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton width={200} height={36} />
      <Skeleton width={300} height={14} />
    </div>
  );
}

/**
 * Generic Card Skeleton
 */
export function CardSkeleton({
  height = 200,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('bg-bg-secondary rounded-lg border border-border p-6', className)}
      style={{ height }}
    >
      <Skeleton width="60%" height={20} className="mb-4" />
      <Skeleton width="100%" height={16} className="mb-3" />
      <Skeleton width="90%" height={16} className="mb-3" />
      <Skeleton width="70%" height={16} />
    </div>
  );
}
