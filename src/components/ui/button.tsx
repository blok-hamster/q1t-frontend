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
      'rounded-xs font-mono font-bold uppercase tracking-wider',
      'transition-colors duration-150',
      'focus:outline-none focus:ring-1 focus:ring-[#20B2AA]',
      'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none',
    ];

    const variants = {
      primary: [
        'bg-[#20B2AA] text-[#080A0C]',
        'hover:bg-[#1CA099]',
      ],
      secondary: [
        'bg-[#16191E] text-[#E1E4E8]',
        'border border-[#1B2026]',
        'hover:bg-[#1C2026] hover:border-[#2A313A]',
      ],
      outlined: [
        'bg-transparent text-[#E1E4E8]',
        'border border-[#1B2026]',
        'hover:border-[#20B2AA] hover:bg-[#20B2AA]/10',
      ],
      ghost: [
        'bg-transparent text-[#8B949E]',
        'hover:bg-[#16191E] hover:text-[#E1E4E8]',
      ],
      danger: [
        'bg-[#E55353]/15 text-[#E55353]',
        'border border-[#E55353]/30',
        'hover:bg-[#E55353]/25',
      ],
    };

    const sizes = {
      sm: 'h-7 px-2.5 text-[10px]',
      md: 'h-8 px-3.5 text-xs',
      lg: 'h-10 px-5 text-xs',
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
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
