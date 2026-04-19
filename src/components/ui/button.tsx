import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center gap-2',
      'rounded-md font-semibold',
      'transition-all duration-fast',
      'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'active:scale-[0.98]',
    ];

    const variants = {
      primary: [
        'bg-accent-primary text-bg-primary',
        'hover:bg-accent-hover',
        'shadow-sm hover:shadow-md',
      ],
      secondary: [
        'bg-bg-secondary text-text-primary',
        'border border-border',
        'hover:bg-bg-tertiary hover:border-border-hover',
      ],
      outlined: [
        'bg-transparent text-text-primary',
        'border-2 border-border',
        'hover:border-border-hover hover:bg-white/5',
      ],
      ghost: [
        'bg-transparent text-text-secondary',
        'hover:bg-white/5 hover:text-text-primary',
      ],
      danger: [
        'bg-negative/20 text-negative',
        'border border-negative/50',
        'hover:bg-negative/30',
      ],
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
