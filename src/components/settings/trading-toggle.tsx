'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { Bot, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TradingToggleProps {
  onUpdate?: () => void;
}

export function TradingToggle({ onUpdate }: TradingToggleProps) {
  const [isActive, setIsActive] = useState(false);
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Fetch trading status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setChecking(true);
    try {
      const data = await settingsApi.getTradingStatus();
      setIsActive(data.isActive);
      setHasPrivateKey(data.hasPrivateKey);
      setWalletAddress(data.wallet_address || '');
    } catch (error) {
      console.error('Failed to fetch trading status:', error);
      toast.error('Failed to load trading status');
    } finally {
      setChecking(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!hasPrivateKey) {
      toast.error('Please add your private key first!');
      return;
    }

    setLoading(true);

    try {
      const data = await settingsApi.toggleTrading(checked);
      setIsActive(data.isActive);
      toast.success(data.message);
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle trading');
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="bg-[#0F1215] border border-[#1B2026] p-4 select-none font-mono animate-pulse">
        <div className="h-4 bg-[#1B2026] w-1/3 mb-2" />
        <div className="h-3 bg-[#1B2026] w-2/3" />
      </div>
    );
  }

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] select-none font-mono">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]/60">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#20B2AA]" />
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069] block">
              EXECUTION ENGINE
            </span>
            <h3 className="font-mono text-xs font-bold text-[#E1E4E8] mt-0.5 uppercase">
              AUTOMATED TRADING CONTROL
            </h3>
          </div>
        </div>
        <span
          className={cn(
            'font-mono text-[10px] font-bold uppercase px-2 py-0.5 border rounded-xs',
            isActive
              ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
              : 'bg-[#586069]/15 text-[#586069] border-[#586069]/30'
          )}
        >
          {isActive ? '● ACTIVE' : '○ INACTIVE'}
        </span>
      </div>

      <div className="p-4 space-y-4 font-mono text-xs">
        {/* Warning if no private key */}
        {!hasPrivateKey && (
          <div className="p-3 bg-[#E55353]/10 border border-[#E55353]/30 rounded-xs">
            <div className="flex gap-2.5 items-start">
              <AlertCircle className="h-4 w-4 text-[#E55353] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#E55353] uppercase text-[10px] tracking-wide">
                  PRIVATE KEY REQUIRED
                </p>
                <p className="text-[#8B949E] text-xs mt-0.5">
                  You need to configure your private key before enabling automated execution.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Control Bar */}
        <div className="flex items-center justify-between p-3 bg-[#080A0C] border border-[#1B2026] rounded-xs">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-xs border',
                isActive
                  ? 'bg-[#20B2AA]/10 border-[#20B2AA]/30 text-[#20B2AA]'
                  : 'bg-[#16191E] border-[#1B2026] text-[#586069]'
              )}
            >
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#E1E4E8]">AUTOMATED EXECUTION ENGINE</p>
              <p className="text-[10px] text-[#8B949E] uppercase font-bold mt-0.5">
                {isActive ? 'AUTOMATED TRADING IS CURRENTLY RUNNING' : 'AUTOMATED TRADING IS PAUSED'}
              </p>
            </div>
          </div>

          <Switch
            checked={isActive}
            onChange={handleToggle}
            disabled={loading || !hasPrivateKey}
          />
        </div>

        {/* Active Info Banner */}
        {isActive && hasPrivateKey && (
          <div className="p-3 bg-[#20B2AA]/10 border border-[#20B2AA]/30 rounded-xs">
            <div className="flex gap-2.5 items-start">
              <CheckCircle className="h-4 w-4 text-[#20B2AA] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#20B2AA] uppercase text-[10px] tracking-wide">
                  AUTOMATED TRADING ONLINE
                </p>
                <p className="text-[#8B949E] text-xs mt-0.5">
                  The execution engine is continuously evaluating window signals and submitting FOK orders per your active configurations.
                </p>
                {walletAddress && (
                  <p className="text-[#586069] text-[10px] font-mono font-bold uppercase mt-1">
                    ACTIVE WALLET: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
