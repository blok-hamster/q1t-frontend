'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import {
  Coins,
  CheckCircle,
  Info,
} from 'lucide-react';

interface AutoClaimToggleProps {
  initialEnabled: boolean;
  hasPrivateKey: boolean;
  onUpdate?: () => void;
}

export function AutoClaimToggle({ initialEnabled, hasPrivateKey, onUpdate }: AutoClaimToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);

    try {
      const data = await settingsApi.toggleAutoClaim(checked);
      setIsEnabled(data.auto_claim);
      toast.success(data.message);
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle auto-claim');
      setIsEnabled(!checked);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="h-5 w-5 text-accent-primary" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Auto-Claim Winnings
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {isEnabled
                  ? 'Winnings are automatically claimed after resolution'
                  : 'Enable to auto-claim winnings from resolved trades'}
              </p>
            </div>
          </div>
          <Badge variant={isEnabled ? 'success' : 'neutral'}>
            {isEnabled ? 'ON' : 'OFF'}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                isEnabled ? 'bg-positive/20' : 'bg-text-tertiary/20'
              }`}
            >
              <Coins
                className={`h-5 w-5 ${
                  isEnabled ? 'text-positive' : 'text-text-tertiary'
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Auto-Claim
              </p>
              <p className="text-xs text-text-secondary">
                {isEnabled ? 'Currently enabled' : 'Currently disabled'}
              </p>
            </div>
          </div>

          <Switch
            checked={isEnabled}
            onChange={handleToggle}
            disabled={loading}
          />
        </div>

        {/* Status when enabled */}
        {isEnabled && hasPrivateKey && (
          <div className="p-4 bg-positive/10 border border-positive/30 rounded-lg">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-positive flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-text-primary mb-1">
                  Auto-Claim Active
                </p>
                <p className="text-text-secondary text-xs">
                  When a trade resolves as a win, your USDC winnings will be
                  automatically redeemed back to your wallet for immediate
                  reinvestment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info when disabled */}
        {!isEnabled && hasPrivateKey && (
          <div className="p-4 bg-accent-muted rounded-lg border border-accent-primary/30">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-accent-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-text-primary mb-1">
                  Why Auto-Claim?
                </p>
                <p className="text-text-secondary text-xs">
                  Without auto-claim, you need to manually claim winnings on
                  Polymarket after each resolved trade. Auto-claim returns USDC
                  to your wallet instantly so it&apos;s available for the next bet.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
