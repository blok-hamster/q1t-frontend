'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/format';
import type { Trade } from '@/types/trade';

interface DayData {
  pnl: number;
  wins: number;
  losses: number;
}

interface CalendarPnlProps {
  trades: Trade[];
  className?: string;
}

export function CalendarPnl({ trades, className }: CalendarPnlProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const dailyPnlMap = useMemo(() => {
    const map = new Map<string, DayData>();
    trades
      .filter(
        (t) =>
          (t.status === 'CLOSED_WIN' || t.status === 'CLOSED_LOSS') &&
          t.pnl !== null
      )
      .forEach((trade) => {
        const dateKey = format(
          new Date(trade.resolved_at || trade.createdAt),
          'yyyy-MM-dd'
        );
        const existing = map.get(dateKey) || { pnl: 0, wins: 0, losses: 0 };
        existing.pnl += trade.pnl!;
        if (trade.pnl! > 0) existing.wins++;
        else existing.losses++;
        map.set(dateKey, existing);
      });
    return map;
  }, [trades]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const monthlySummary = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    let totalPnl = 0;
    let winDays = 0;
    let lossDays = 0;

    dailyPnlMap.forEach((data, dateKey) => {
      const date = new Date(dateKey + 'T12:00:00');
      if (date >= monthStart && date <= monthEnd) {
        totalPnl += data.pnl;
        if (data.pnl > 0) winDays++;
        else if (data.pnl < 0) lossDays++;
      }
    });

    return { totalPnl, winDays, lossDays };
  }, [dailyPnlMap, currentMonth]);

  return (
    <div
      className={cn(
        'bg-[#0F1215] border border-[#1B2026] select-none font-mono text-xs',
        className
      )}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#1B2026] bg-[#16191E]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#20B2AA]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
            DAILY P&L CALENDAR
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-1 text-[#8B949E] hover:text-[#E1E4E8] transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-bold text-[#E1E4E8] uppercase w-28 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-1 text-[#8B949E] hover:text-[#E1E4E8] transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3.5">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1.5">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
            <div
              key={d}
              className="text-center text-[9px] font-bold text-[#586069] uppercase py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = dailyPnlMap.get(dateKey);
            const isCurrentMonthDay = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dateKey}
                className={cn(
                  'p-1 min-h-[44px] md:min-h-[48px] border rounded-sm flex flex-col items-center justify-center transition-colors',
                  !isCurrentMonthDay && 'opacity-30',
                  isToday && 'ring-1 ring-[#20B2AA]/50',
                  getDayCellClasses(dayData, isCurrentMonthDay)
                )}
              >
                <span
                  className={cn(
                    'text-[10px]',
                    isToday ? 'text-[#20B2AA] font-bold' : 'text-[#8B949E]'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayData && isCurrentMonthDay && (
                  <span
                    className={cn(
                      'text-[9px] md:text-[10px] font-bold tabular-nums mt-0.5',
                      dayData.pnl > 0 ? 'text-[#20B2AA]' : 'text-[#E55353]'
                    )}
                  >
                    {dayData.pnl > 0 ? '+' : ''}
                    {formatCurrency(dayData.pnl)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary Footer */}
      <div className="px-3.5 py-2.5 border-t border-[#1B2026] flex items-center justify-between">
        <span
          className={cn(
            'text-[10px] font-bold tabular-nums',
            monthlySummary.totalPnl > 0
              ? 'text-[#20B2AA]'
              : monthlySummary.totalPnl < 0
                ? 'text-[#E55353]'
                : 'text-[#8B949E]'
          )}
        >
          MONTH P&L:{' '}
          {monthlySummary.totalPnl > 0 ? '+' : ''}
          {formatCurrency(monthlySummary.totalPnl)}
        </span>
        <span className="text-[10px] text-[#8B949E]">
          <span className="text-[#20B2AA] font-bold">
            {monthlySummary.winDays}W
          </span>
          {' / '}
          <span className="text-[#E55353] font-bold">
            {monthlySummary.lossDays}L
          </span>
          {' DAYS'}
        </span>
      </div>
    </div>
  );
}

function getDayCellClasses(
  dayData: DayData | undefined,
  isCurrentMonth: boolean
): string {
  if (!dayData || !isCurrentMonth) {
    return 'border-[#1B2026]';
  }

  const { pnl } = dayData;
  const threshold = 5;

  if (pnl > 0) {
    return Math.abs(pnl) >= threshold
      ? 'bg-[#20B2AA]/20 border-[#20B2AA]/40'
      : 'bg-[#20B2AA]/10 border-[#20B2AA]/20';
  }
  if (pnl < 0) {
    return Math.abs(pnl) >= threshold
      ? 'bg-[#E55353]/20 border-[#E55353]/40'
      : 'bg-[#E55353]/10 border-[#E55353]/20';
  }
  return 'border-[#1B2026]';
}
