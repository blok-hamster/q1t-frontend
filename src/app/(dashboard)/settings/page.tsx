'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { settingsApi, portfolioApi } from '@/lib/api';
import { StrategySelectionPanel } from '@/components/settings/strategy-selection-panel';
import { SecuritySettings } from '@/components/settings/security-settings';
import { PrivateKeySetup } from '@/components/settings/private-key-setup';
import { TradingToggle } from '@/components/settings/trading-toggle';
import { PaperBalancePanel } from '@/components/settings/paper-balance-panel';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import { User } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [liveUsdc, setLiveUsdc] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, bal] = await Promise.all([
          settingsApi.getSettings(),
          portfolioApi.getBalances().catch(() => null),
        ]);
        setSettings(data);
        if (bal && typeof bal.usdc === 'number' && bal.usdc > 0) {
          setLiveUsdc(bal.usdc);
        }
      } catch (error) {
        toast.error('Failed to load system preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSecurityUpdate = async () => {
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to refresh settings:', error);
    }
  };

  if (loading) {
    return <Loading text="Loading system preferences..." />;
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto px-4 py-4 font-mono">
      {/* Account Information Card */}
      <div className="bg-[#0F1215] border border-[#1B2026] p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1B2026]">
          <User className="h-4 w-4 text-[#20B2AA]" />
          <h3 className="text-xs font-mono font-bold text-[#E1E4E8] uppercase tracking-wide">
            ACCOUNT CREDENTIALS & SESSIONS
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-[10px] text-[#586069] uppercase font-bold mb-1">
              EMAIL ADDRESS
            </p>
            <p className="text-[#E1E4E8] font-bold">
              {settings?.email || user?.email || 'Not available'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#586069] uppercase font-bold mb-1">
              ACCOUNT REGISTERED
            </p>
            <p className="text-[#E1E4E8] font-bold">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }).toUpperCase()
                : 'NOT AVAILABLE'}
            </p>
          </div>
        </div>
      </div>

      {/* Private Key Setup */}
      <PrivateKeySetup
        twoFactorEnabled={settings?.twoFactorEnabled || false}
        onUpdate={handleSecurityUpdate}
      />

      {/* Trading Toggle */}
      <TradingToggle onUpdate={handleSecurityUpdate} />

      {/* Paper Trading Balance */}
      <PaperBalancePanel
        initialBalance={settings?.paperBalance ?? 1000}
        onUpdate={(newBalance) => setSettings((prev: any) => ({ ...prev, paperBalance: newBalance }))}
      />

      {/* Strategy Selection */}
      <StrategySelectionPanel
        initialStrategy={settings?.strategySelection || { active_strategies: ['mid_market'], mid_market_markets: ['btc-5m'] }}
        marketConfigs={settings?.marketConfigs || []}
        riskConfig={settings?.riskConfig}
        balanceUsd={settings?.isActive && liveUsdc > 0 ? liveUsdc : (settings?.paperBalance ?? (liveUsdc > 0 ? liveUsdc : 1000))}
        onUpdate={(newStrategy) => setSettings((prev: any) => ({ ...prev, strategySelection: newStrategy }))}
        onRiskConfigUpdate={(nextRc, nextMcs) =>
          setSettings((prev: any) => ({
            ...prev,
            riskConfig: nextRc,
            ...(nextMcs ? { marketConfigs: nextMcs } : {}),
          }))
        }
        onMarketConfigsUpdate={(updatedConfigs) =>
          setSettings((prev: any) => ({ ...prev, marketConfigs: updatedConfigs }))
        }
      />

      {/* Security Settings */}
      <SecuritySettings
        twoFactorEnabled={settings?.twoFactorEnabled || false}
        onUpdate={handleSecurityUpdate}
      />
    </div>
  );
}
