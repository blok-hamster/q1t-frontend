'use client';

import { Wallet, Zap, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WalletTypeSelectorProps {
  selectedType: 'eoa' | 'proxy';
  onSelect: (type: 'eoa' | 'proxy') => void;
  disabled?: boolean;
}

export function WalletTypeSelector({
  selectedType,
  onSelect,
  disabled = false
}: WalletTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">
        Choose Wallet Type
      </h3>
      <p className="text-sm text-text-secondary">
        Select how you want to manage your trading wallet
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EOA Option */}
        <button
          type="button"
          onClick={() => !disabled && onSelect('eoa')}
          disabled={disabled}
          className={`
            p-4 border-2 rounded-lg text-left transition-all
            ${selectedType === 'eoa'
              ? 'border-accent-primary bg-accent-primary/10'
              : 'border-border-secondary hover:border-accent-primary/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-start gap-3">
            <Wallet className={`h-6 w-6 mt-1 ${
              selectedType === 'eoa' ? 'text-accent-primary' : 'text-text-secondary'
            }`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-text-primary">
                  Self-Custodial (EOA)
                </h4>
                {selectedType === 'eoa' && (
                  <Badge variant="success" size="sm">Selected</Badge>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-3">
                Full control of your wallet. You manage your own private key and funds.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-positive">✓</span>
                  <span className="text-text-secondary">Complete control of funds</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-positive">✓</span>
                  <span className="text-text-secondary">Use any Polygon wallet</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-neutral">⚠</span>
                  <span className="text-text-secondary">Requires 2-3 POL for gas fees</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Gasless Option */}
        <button
          type="button"
          onClick={() => !disabled && onSelect('proxy')}
          disabled={disabled}
          className={`
            p-4 border-2 rounded-lg text-left transition-all
            ${selectedType === 'proxy'
              ? 'border-accent-primary bg-accent-primary/10'
              : 'border-border-secondary hover:border-accent-primary/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-start gap-3">
            <Zap className={`h-6 w-6 mt-1 ${
              selectedType === 'proxy' ? 'text-accent-primary' : 'text-text-secondary'
            }`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-text-primary">
                  Gasless (Recommended)
                </h4>
                {selectedType === 'proxy' && (
                  <Badge variant="success" size="sm">Selected</Badge>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-3">
                Connect your Polymarket wallet. No gas fees needed.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-positive">✓</span>
                  <span className="text-text-secondary">No POL/MATIC needed</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-positive">✓</span>
                  <span className="text-text-secondary">Fund directly on Polymarket</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-positive">✓</span>
                  <span className="text-text-secondary">Simpler setup</span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Info Alert */}
      <div className="p-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle className="h-4 w-4 text-accent-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary">
            {selectedType === 'eoa'
              ? 'EOA mode gives you complete control but requires POL for gas. You\'ll need to send both POL and USDC.e to your wallet.'
              : 'Gasless mode uses your Polymarket proxy wallet. Just fund your Polymarket account with USDC and start trading!'}
          </p>
        </div>
      </div>
    </div>
  );
}
