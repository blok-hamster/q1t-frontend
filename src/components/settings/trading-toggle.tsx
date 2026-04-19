'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import {
  Bot,
  AlertCircle,
  Activity,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

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
      // Revert optimistic update
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card padding="lg">
        <div className="animate-pulse">
          <div className="h-6 bg-bg-tertiary rounded w-1/3 mb-4" />
          <div className="h-4 bg-bg-tertiary rounded w-2/3" />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-accent-primary" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Automated Trading
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {isActive
                  ? 'AI is actively trading on your behalf'
                  : 'Enable AI to execute trades automatically'}
              </p>
            </div>
          </div>
          <Badge variant={isActive ? 'success' : 'neutral'}>
            {isActive ? (
              <>
                <Activity className="h-3 w-3 mr-1" />
                ACTIVE
              </>
            ) : (
              'INACTIVE'
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Warning if no private key */}
        {!hasPrivateKey && (
          <div className="p-4 bg-negative/10 border border-negative/30 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-negative flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-text-primary mb-1">
                  ⚠️ Private Key Required
                </p>
                <p className="text-text-secondary text-xs">
                  You need to add your private key before enabling automated
                  trading. Please add your key in the section above.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                isActive ? 'bg-positive/20' : 'bg-text-tertiary/20'
              }`}
            >
              <TrendingUp
                className={`h-5 w-5 ${
                  isActive ? 'text-positive' : 'text-text-tertiary'
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Active Trading
              </p>
              <p className="text-xs text-text-secondary">
                {isActive ? 'Currently enabled' : 'Currently disabled'}
              </p>
            </div>
          </div>

          <Switch
            checked={isActive}
            onChange={handleToggle}
            disabled={loading || !hasPrivateKey}
          />
        </div>

        {/* Status Information */}
        {isActive && hasPrivateKey && (
          <div className="p-4 bg-positive/10 border border-positive/30 rounded-lg">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-positive flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-text-primary mb-1">
                  ✅ Trading Active
                </p>
                <p className="text-text-secondary text-xs mb-2">
                  The AI will automatically execute trades when high-confidence
                  signals are generated based on your risk configuration.
                </p>
                {walletAddress && (
                  <p className="text-text-tertiary text-xs font-mono">
                    Wallet: {walletAddress.slice(0, 6)}...
                    {walletAddress.slice(-4)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info about what happens when enabled */}
        {!isActive && hasPrivateKey && (
          <div className="p-4 bg-accent-muted rounded-lg border border-accent-primary/30">
            <div className="flex gap-3">
              <Bot className="h-5 w-5 text-accent-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-text-primary mb-1">
                  How It Works
                </p>
                <ul className="text-text-secondary text-xs space-y-1 list-disc list-inside">
                  <li>AI analyzes market data every 5 minutes</li>
                  <li>
                    Trades only execute when confidence exceeds your minimum
                  </li>
                  <li>Position sizes respect your max bet % setting</li>
                  <li>All trades are visible in the Trades page</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
