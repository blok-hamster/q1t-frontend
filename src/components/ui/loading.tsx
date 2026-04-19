import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Spinner component
 */
export function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={cn('inline-block', className)} {...props}>
      <Loader2
        className={cn('animate-spin text-accent-primary', sizes[size])}
      />
    </div>
  );
}

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

/**
 * Loading component with optional text
 */
export function Loading({
  className,
  text,
  size = 'md',
  fullScreen = false,
  ...props
}: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Spinner size={size} />
      {text && (
        <p className="text-sm text-text-secondary animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50',
          'flex items-center justify-center',
          'bg-bg-primary',
          className
        )}
        {...props}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center p-8', className)}
      {...props}
    >
      {content}
    </div>
  );
}

/**
 * Skeleton loading component
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      className={cn(
        'bg-bg-tertiary animate-pulse',
        variants[variant],
        className
      )}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Skeleton text lines
 */
export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
}
