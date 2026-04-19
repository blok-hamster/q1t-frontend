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
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-text-primary">
            {label}
            {props.required && (
              <span className="text-negative ml-1">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full h-10 px-3 rounded-md',
              'bg-bg-secondary border border-border',
              'text-text-primary placeholder:text-text-tertiary',
              'transition-colors duration-fast',
              'focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              (rightIcon || isPassword || hasError || hasSuccess) && 'pr-10',
              hasError && 'border-negative focus:border-negative focus:ring-negative',
              hasSuccess && 'border-positive focus:border-positive focus:ring-positive',
              className
            )}
            disabled={disabled}
            {...props}
          />

          {/* Right icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {hasError && (
              <AlertCircle className="h-4 w-4 text-negative" />
            )}
            {hasSuccess && (
              <CheckCircle2 className="h-4 w-4 text-positive" />
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            {rightIcon && !isPassword && !hasError && !hasSuccess && (
              <div className="text-text-tertiary">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Helper text / Error / Success messages */}
        {(error || success || helperText) && (
          <p
            className={cn(
              'text-xs',
              hasError && 'text-negative',
              hasSuccess && 'text-positive',
              !hasError && !hasSuccess && 'text-text-tertiary'
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

/**
 * Textarea component
 */
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
      rows = 4,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-sm font-medium text-text-primary">
            {label}
            {props.required && (
              <span className="text-negative ml-1">*</span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full px-3 py-2 rounded-md',
            'bg-bg-secondary border border-border',
            'text-text-primary placeholder:text-text-tertiary',
            'transition-colors duration-fast',
            'focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-y',
            hasError && 'border-negative focus:border-negative focus:ring-negative',
            className
          )}
          disabled={disabled}
          {...props}
        />

        {(error || helperText) && (
          <p
            className={cn(
              'text-xs',
              hasError ? 'text-negative' : 'text-text-tertiary'
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
