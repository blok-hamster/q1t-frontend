'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  formatValue?: (value: number) => string;
  showValue?: boolean;
  showMinMax?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      label,
      min = 0,
      max = 100,
      step = 1,
      value = 0,
      formatValue,
      showValue = true,
      showMinMax = false,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const displayValue = formatValue ? formatValue(value) : value;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = Number(e.target.value);
      if (!isNaN(numValue) && onChange) {
        onChange(numValue);
      }
    };

    return (
      <div className={cn('w-full space-y-2', className)}>
        {/* Label and value */}
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <label className="text-sm font-medium text-text-primary">
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm font-semibold text-accent-primary font-mono">
                {displayValue}
              </span>
            )}
          </div>
        )}

        {/* Slider */}
        <div className="relative">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              'w-full h-2 appearance-none rounded-full',
              'bg-bg-tertiary',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'slider-thumb',
              className
            )}
            style={{
              background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${percentage}%, var(--bg-tertiary) ${percentage}%, var(--bg-tertiary) 100%)`,
            }}
            {...props}
          />
        </div>

        {/* Min/Max labels */}
        {showMinMax && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">
              {formatValue ? formatValue(min) : min}
            </span>
            <span className="text-xs text-text-tertiary">
              {formatValue ? formatValue(max) : max}
            </span>
          </div>
        )}

        <style jsx>{`
          input[type='range']::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--accent-primary);
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease;
          }

          input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }

          input[type='range']::-webkit-slider-thumb:active {
            transform: scale(0.95);
          }

          input[type='range']::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--accent-primary);
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease;
          }

          input[type='range']::-moz-range-thumb:hover {
            transform: scale(1.1);
          }

          input[type='range']::-moz-range-thumb:active {
            transform: scale(0.95);
          }

          input[type='range']:disabled::-webkit-slider-thumb,
          input[type='range']:disabled::-moz-range-thumb {
            cursor: not-allowed;
            background: var(--text-disabled);
          }
        `}</style>
      </div>
    );
  }
);

Slider.displayName = 'Slider';
