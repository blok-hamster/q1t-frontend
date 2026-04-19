'use client';

import { Badge } from '@/components/ui/badge';
import { TRADE_STATUS_LABELS, TRADE_STATUS_COLORS } from '@/lib/constants';
import type { TradeStatus } from '@/types/trade';
import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';

interface TradeStatusBadgeProps {
  status: TradeStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function TradeStatusBadge({ status, size = 'md' }: TradeStatusBadgeProps) {
  const config = TRADE_STATUS_COLORS[status];
  const label = TRADE_STATUS_LABELS[status];

  const getIcon = () => {
    switch (status) {
      case 'CLOSED_WIN':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'CLOSED_LOSS':
        return <XCircle className="h-3 w-3" />;
      case 'OPEN':
        return <Clock className="h-3 w-3" />;
      case 'PENDING':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'REJECTED':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium ${config.text} ${config.bg}`}
    >
      {getIcon()}
      {label}
    </span>
  );
}
