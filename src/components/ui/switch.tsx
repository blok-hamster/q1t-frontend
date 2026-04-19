'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      label,
      description,
      size = 'md',
      checked,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: {
        switch: 'w-9 h-5',
        thumb: 'w-4 h-4',
        translate: 'translate-x-4',
      },
      md: {
        switch: 'w-11 h-6',
        thumb: 'w-5 h-5',
        translate: 'translate-x-5',
      },
      lg: {
        switch: 'w-14 h-7',
        thumb: 'w-6 h-6',
        translate: 'translate-x-7',
      },
    };

    const sizeStyles = sizes[size];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.checked);
      }
    };

    return (
      <label
        className={cn(
          'inline-flex items-center gap-3',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer',
          className
        )}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            {...props}
          />
          <div
            className={cn(
              'relative rounded-full transition-colors duration-200',
              'bg-bg-tertiary border-2 border-border',
              'peer-checked:bg-accent-primary peer-checked:border-accent-primary',
              'peer-focus:ring-2 peer-focus:ring-accent-primary peer-focus:ring-offset-2 peer-focus:ring-offset-bg-primary',
              sizeStyles.switch
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 left-0.5',
                'rounded-full bg-white',
                'transition-transform duration-200',
                'peer-checked:' + sizeStyles.translate,
                sizeStyles.thumb
              )}
            />
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-text-primary">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-text-secondary">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
