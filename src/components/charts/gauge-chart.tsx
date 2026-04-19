'use client';

import { cn } from '@/lib/utils/cn';
import { formatCompactNumber } from '@/lib/utils/format';

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  size?: number;
  className?: string;
}

export function GaugeChart({
  value,
  max,
  label,
  unit = '',
  size = 180,
  className,
}: GaugeChartProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 70; // radius = 70
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="16"
          />

          {/* Progress ring with gradient */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#00FF88" />
            </linearGradient>
          </defs>

          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold font-mono text-text-primary">
            {formatCompactNumber(value)}
          </p>
          {unit && (
            <p className="text-xs text-text-tertiary uppercase mt-1">{unit}</p>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-xs text-text-tertiary mt-1">
          {percentage.toFixed(1)}% of max
        </p>
      </div>
    </div>
  );
}
