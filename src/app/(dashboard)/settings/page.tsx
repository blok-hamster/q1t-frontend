'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { settingsApi } from '@/lib/api';
import { RiskConfigPanel } from '@/components/settings/risk-config-panel';
import { SecuritySettings } from '@/components/settings/security-settings';
import { PrivateKeySetup } from '@/components/settings/private-key-setup';
import { TradingToggle } from '@/components/settings/trading-toggle';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import { User } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        setSettings(data);
      } catch (error) {
        toast.error('Failed to load settings');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleRiskConfigUpdate = (newConfig: any) => {
    setSettings((prev: any) => ({
      ...prev,
      riskConfig: newConfig,
    }));
  };

  const handleSecurityUpdate = async () => {
    // Refresh settings after security changes
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to refresh settings:', error);
    }
  };

  if (loading) {
    return <Loading text="Loading settings..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your account and risk preferences
        </p>
      </div>

      {/* Account Information */}
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-accent-primary" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Account Information
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Your account details
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
                Email Address
              </p>
              <p className="text-sm font-medium text-text-primary">
                {settings?.email || user?.email || 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
                Member Since
              </p>
              <p className="text-sm font-medium text-text-primary">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Not available'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Private Key Setup */}
      <PrivateKeySetup
        twoFactorEnabled={settings?.twoFactorEnabled || false}
        onUpdate={handleSecurityUpdate}
      />

      {/* Trading Toggle */}
      <TradingToggle onUpdate={handleSecurityUpdate} />

      {/* Risk Configuration */}
      <RiskConfigPanel
        initialConfig={settings?.riskConfig || {
          max_bet_pct: 0.05,
          min_confidence: 0.60,
          use_kelly: true,
        }}
        onSave={handleRiskConfigUpdate}
      />

      {/* Security Settings */}
      <SecuritySettings
        twoFactorEnabled={settings?.twoFactorEnabled || false}
        onUpdate={handleSecurityUpdate}
      />
    </div>
  );
}
