'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { AlertTriangle, Save, RotateCcw } from 'lucide-react';

interface RiskConfig {
  max_bet_pct: number; // 0.01 to 0.50 (1% to 50%)
  min_confidence: number; // 0.50 to 0.95 (50% to 95%)
  use_kelly: boolean;
}

interface RiskConfigPanelProps {
  initialConfig: RiskConfig;
  onSave?: (config: RiskConfig) => void;
}

export function RiskConfigPanel({ initialConfig, onSave }: RiskConfigPanelProps) {
  const [config, setConfig] = useState<RiskConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleMaxBetChange = (value: number) => {
    setConfig((prev) => ({ ...prev, max_bet_pct: value }));
    setHasChanges(true);
  };

  const handleMinConfidenceChange = (value: number) => {
    setConfig((prev) => ({ ...prev, min_confidence: value }));
    setHasChanges(true);
  };

  const handleKellyToggle = (checked: boolean) => {
    setConfig((prev) => ({ ...prev, use_kelly: checked }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setConfig(initialConfig);
    setHasChanges(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.updateRiskConfig(config);
      toast.success('Risk configuration updated successfully');
      setHasChanges(false);
      onSave?.(config);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update risk configuration');
    } finally {
      setSaving(false);
    }
  };

  const getRiskLevel = (): { level: string; color: 'success' | 'warning' | 'error' } => {
    const riskScore = config.max_bet_pct / 0.50 + (1 - config.min_confidence / 0.95);

    if (riskScore < 0.5) {
      return { level: 'Conservative', color: 'success' };
    } else if (riskScore < 1.0) {
      return { level: 'Moderate', color: 'warning' };
    } else {
      return { level: 'Aggressive', color: 'error' };
    }
  };

  const riskLevel = getRiskLevel();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Risk Configuration
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Manage your trading risk parameters
            </p>
          </div>
          <Badge variant={riskLevel.color}>
            {riskLevel.level} Risk
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Warning */}
        <div className="flex gap-3 p-4 bg-neutral/10 border border-neutral/30 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-neutral flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-text-primary mb-1">
              Important: Risk Management
            </p>
            <p className="text-text-secondary text-xs">
              These settings control how much you risk per trade. Lower values are safer
              but may reduce potential profits. Only increase if you understand the risks.
            </p>
          </div>
        </div>

        {/* Max Bet Percentage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary">
              Maximum Bet per Trade
            </label>
            <span className="text-sm font-mono font-semibold text-accent-primary">
              {(config.max_bet_pct * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            min={1}
            max={50}
            step={1}
            value={config.max_bet_pct * 100}
            onChange={(value) => handleMaxBetChange(value / 100)}
            formatValue={(value) => `${value}%`}
          />
          <p className="text-xs text-text-tertiary">
            Maximum percentage of your balance to risk on a single trade (1% - 50%)
          </p>
        </div>

        {/* Min Confidence */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary">
              Minimum AI Confidence
            </label>
            <span className="text-sm font-mono font-semibold text-accent-primary">
              {(config.min_confidence * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            min={50}
            max={95}
            step={1}
            value={config.min_confidence * 100}
            onChange={(value) => handleMinConfidenceChange(value / 100)}
            formatValue={(value) => `${value}%`}
          />
          <p className="text-xs text-text-tertiary">
            Only place trades when AI confidence exceeds this threshold (50% - 95%)
          </p>
        </div>

        {/* Kelly Criterion */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
            <div className="flex-1">
              <label className="text-sm font-medium text-text-primary block mb-1">
                Use Kelly Criterion
              </label>
              <p className="text-xs text-text-tertiary">
                Automatically adjust bet size based on edge and win probability
              </p>
            </div>
            <Switch
              checked={config.use_kelly}
              onChange={handleKellyToggle}
            />
          </div>
        </div>

        {/* Current Settings Preview */}
        <div className="p-4 bg-accent-muted border border-accent-primary/30 rounded-lg">
          <p className="text-xs font-semibold text-accent-primary uppercase tracking-wide mb-3">
            Preview: With $1,000 balance
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-tertiary text-xs mb-1">Max bet size:</p>
              <p className="font-mono font-semibold text-text-primary">
                ${(1000 * config.max_bet_pct).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-xs mb-1">Min confidence:</p>
              <p className="font-mono font-semibold text-text-primary">
                {(config.min_confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </CardBody>

      {/* Actions */}
      {hasChanges && (
        <CardFooter>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              loading={saving}
              className="ml-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
