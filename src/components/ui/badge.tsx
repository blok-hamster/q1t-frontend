import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'default';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'sm',
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center gap-1',
      'rounded-xs font-mono font-bold uppercase tracking-wider',
      'whitespace-nowrap select-none border',
    ];

    const variants = {
      success: 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30',
      error: 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30',
      warning: 'bg-[#D99B00]/15 text-[#D99B00] border-[#D99B00]/30',
      info: 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/20',
      neutral: 'bg-[#16191E] text-[#8B949E] border-[#1B2026]',
      default: 'bg-[#16191E] text-[#E1E4E8] border-[#1B2026]',
    };

    const sizes = {
      sm: 'px-1.5 py-0.5 text-[9px]',
      md: 'px-2 py-0.5 text-[10px]',
      lg: 'px-2.5 py-1 text-xs',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {dot && (
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
