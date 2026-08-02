import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success);

    return (
      <div className={cn('flex flex-col gap-1 font-mono', fullWidth && 'w-full')}>
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#586069]">
            {label}
            {props.required && (
              <span className="text-[#E55353] ml-1">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#586069]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full h-8 px-3 rounded-xs text-xs font-mono',
              'bg-[#0F1215] border border-[#1B2026]',
              'text-[#E1E4E8] placeholder:text-[#586069]',
              'transition-colors duration-150',
              'focus:outline-none focus:border-[#20B2AA] focus:ring-1 focus:ring-[#20B2AA]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              leftIcon && 'pl-8',
              (rightIcon || isPassword || hasError || hasSuccess) && 'pr-8',
              hasError && 'border-[#E55353] focus:border-[#E55353] focus:ring-[#E55353]',
              hasSuccess && 'border-[#20B2AA] focus:border-[#20B2AA] focus:ring-[#20B2AA]',
              className
            )}
            disabled={disabled}
            {...props}
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {hasError && (
              <AlertCircle className="h-3.5 w-3.5 text-[#E55353]" />
            )}
            {hasSuccess && (
              <CheckCircle2 className="h-3.5 w-3.5 text-[#20B2AA]" />
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#586069] hover:text-[#E1E4E8] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            {rightIcon && !isPassword && !hasError && !hasSuccess && (
              <div className="text-[#586069]">{rightIcon}</div>
            )}
          </div>
        </div>

        {(error || success || helperText) && (
          <p
            className={cn(
              'text-[10px] font-mono',
              hasError && 'text-[#E55353]',
              hasSuccess && 'text-[#20B2AA]',
              !hasError && !hasSuccess && 'text-[#586069]'
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps
  extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      rows = 3,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1 w-full font-mono">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#586069]">
            {label}
            {props.required && (
              <span className="text-[#E55353] ml-1">*</span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full p-2.5 rounded-xs text-xs font-mono',
            'bg-[#0F1215] border border-[#1B2026]',
            'text-[#E1E4E8] placeholder:text-[#586069]',
            'transition-colors duration-150',
            'focus:outline-none focus:border-[#20B2AA] focus:ring-1 focus:ring-[#20B2AA]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'resize-y',
            hasError && 'border-[#E55353] focus:border-[#E55353]',
            className
          )}
          disabled={disabled}
          {...props}
        />

        {(error || helperText) && (
          <p
            className={cn(
              'text-[10px] font-mono',
              hasError ? 'text-[#E55353]' : 'text-[#586069]'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
