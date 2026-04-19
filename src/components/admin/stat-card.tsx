import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <Card
      padding="lg"
      className={cn('hover:shadow-lg transition-shadow', className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-tertiary mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-primary font-mono">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div
              className={cn('text-xs font-medium mt-2', {
                'text-positive': trend === 'up',
                'text-negative': trend === 'down',
                'text-text-secondary': trend === 'neutral',
              })}
            >
              {trendValue}
            </div>
          )}
        </div>
        <div className="p-3 bg-accent-muted rounded-lg">
          <Icon className="h-6 w-6 text-accent-primary" />
        </div>
      </div>
    </Card>
  );
}
