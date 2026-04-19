'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outlined';
  };
  children?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = {
    sm: {
      icon: 'h-12 w-12',
      title: 'text-base',
      description: 'text-xs',
      padding: 'py-6',
    },
    md: {
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-sm',
      padding: 'py-12',
    },
    lg: {
      icon: 'h-20 w-20',
      title: 'text-2xl',
      description: 'text-base',
      padding: 'py-16',
    },
  };

  return (
    <div className={cn('text-center', sizes[size].padding, className)}>
      {/* Icon */}
      {Icon && (
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-bg-tertiary mb-6">
          <Icon className={cn(sizes[size].icon, 'text-text-tertiary')} />
        </div>
      )}

      {/* Title */}
      <h3 className={cn('font-semibold text-text-primary mb-2', sizes[size].title)}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn('text-text-secondary max-w-md mx-auto mb-6', sizes[size].description)}>
          {description}
        </p>
      )}

      {/* Children */}
      {children}

      {/* Action Button */}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Animated Empty State with floating elements
 */
export function AnimatedEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-16 relative', className)}>
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent-primary/5 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-positive/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {Icon && (
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-accent-primary/20 to-positive/20 mb-6 animate-pulse-slow">
            <Icon className="h-12 w-12 text-accent-primary" />
          </div>
        )}

        <h3 className="text-2xl font-bold text-text-primary mb-3">{title}</h3>

        {description && (
          <p className="text-text-secondary max-w-md mx-auto mb-8 text-lg">
            {description}
          </p>
        )}

        {action && (
          <Button variant={action.variant || 'primary'} onClick={action.onClick} size="lg">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Simple text-only empty state
 */
export function SimpleEmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('text-center py-8', className)}>
      <p className="text-sm font-medium text-text-primary mb-1">{title}</p>
      {description && <p className="text-xs text-text-tertiary">{description}</p>}
    </div>
  );
}
