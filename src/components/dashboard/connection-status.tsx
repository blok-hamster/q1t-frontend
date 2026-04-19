'use client';

import { useSocket } from '@/context/socket-context';
import { cn } from '@/lib/utils/cn';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function ConnectionStatus({
  className,
  showLabel = true,
}: ConnectionStatusProps) {
  const { connected, reconnecting } = useSocket();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {reconnecting ? (
        <>
          <Loader2 className="h-4 w-4 text-neutral animate-spin" />
          {showLabel && (
            <span className="text-sm text-neutral">Reconnecting...</span>
          )}
        </>
      ) : connected ? (
        <>
          <div className="relative">
            <Wifi className="h-4 w-4 text-positive" />
            <div className="absolute inset-0 bg-positive/30 blur-sm rounded-full animate-pulse" />
          </div>
          {showLabel && <span className="text-sm text-positive font-medium">Live</span>}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-negative" />
          {showLabel && (
            <span className="text-sm text-negative">Disconnected</span>
          )}
        </>
      )}
    </div>
  );
}
