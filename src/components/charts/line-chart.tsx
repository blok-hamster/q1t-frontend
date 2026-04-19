'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  Time,
  LineStyle,
} from 'lightweight-charts';
import { cn } from '@/lib/utils/cn';

export interface LineChartDataPoint {
  time: string | Date;
  value: number;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  title?: string;
  color?: string;
  height?: number;
  showArea?: boolean;
  className?: string;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

export function LineChart({
  data,
  title,
  color = '#00D4FF',
  height = 300,
  showArea = true,
  className,
  showGrid = true,
  formatValue,
}: LineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area' | 'Line'> | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#8B8D98',
      },
      grid: {
        vertLines: {
          visible: showGrid,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        horzLines: {
          visible: showGrid,
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(0, 212, 255, 0.5)',
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: 'rgba(0, 212, 255, 0.5)',
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#8B8D98',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create series
    let series: ISeriesApi<'Area' | 'Line'>;

    if (showArea) {
      series = chart.addAreaSeries({
        lineColor: color,
        topColor: `${color}40`, // 25% opacity
        bottomColor: `${color}00`, // 0% opacity
        lineWidth: 2,
      });
    } else {
      series = chart.addLineSeries({
        color,
        lineWidth: 2,
      });
    }

    chartRef.current = chart;
    seriesRef.current = series;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height, color, showArea, showGrid]);

  // Update chart data
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    const chartData: LineData<Time>[] = data.map((point) => ({
      time: (new Date(point.time).getTime() / 1000) as Time,
      value: point.value,
    }));

    seriesRef.current.setData(chartData);

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  // Calculate stats
  const stats = data.length > 0 ? {
    current: data[data.length - 1]?.value || 0,
    change: data.length > 1
      ? data[data.length - 1].value - data[0].value
      : 0,
    changePercent: data.length > 1
      ? ((data[data.length - 1].value - data[0].value) / data[0].value) * 100
      : 0,
  } : null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with stats */}
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {stats && (
            <div className="flex items-center gap-3">
              <span className="text-lg font-mono font-semibold text-text-primary">
                {formatValue ? formatValue(stats.current) : stats.current.toFixed(2)}
              </span>
              <span
                className={cn(
                  'text-sm font-mono',
                  stats.change > 0
                    ? 'text-positive'
                    : stats.change < 0
                    ? 'text-negative'
                    : 'text-text-secondary'
                )}
              >
                {stats.change > 0 ? '+' : ''}
                {formatValue ? formatValue(stats.change) : stats.change.toFixed(2)}
                {' '}
                ({stats.changePercent > 0 ? '+' : ''}
                {stats.changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="bg-bg-primary rounded-lg border border-border overflow-hidden">
        <div ref={chartContainerRef} />
      </div>
    </div>
  );
}

/**
 * Mini sparkline chart (no axes, minimal UI)
 */
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  color = '#00D4FF',
  height = 40,
  className,
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Calculate min/max for scaling
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Calculate step size
    const step = width / (data.length - 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    data.forEach((value, index) => {
      const x = index * step;
      const y = canvasHeight - ((value - min) / range) * canvasHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw filled area
    ctx.lineTo(width, canvasHeight);
    ctx.lineTo(0, canvasHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}00`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [data, color]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={height}
      className={cn('w-full', className)}
    />
  );
}
