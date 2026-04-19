'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Zap,
  ExternalLink,
  CheckCircle,
  Shield
} from 'lucide-react';
import { toast } from '@/context/toast-context';

interface ProxyWalletSetupProps {
  onSubmit: (data: {
    privateKey: string;
    fundingAddress: string;
    totpCode?: string;
  }) => Promise<void>;
  twoFactorEnabled: boolean;
  loading: boolean;
}

export function ProxyWalletSetup({
  onSubmit,
  twoFactorEnabled,
  loading
}: ProxyWalletSetupProps) {
  const [privateKey, setPrivateKey] = useState('');
  const [fundingAddress, setFundingAddress] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [step, setStep] = useState(1); // 1: Instructions, 2: Input

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onSubmit({
      privateKey,
      fundingAddress,
      totpCode: twoFactorEnabled ? totpCode : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Instructions */}
      {step === 1 && (
        <Card padding="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-primary/20 rounded-lg">
                <Zap className="h-6 w-6 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Setup Gasless Trading
                </h3>
                <p className="text-sm text-text-secondary">
                  Connect your Polymarket wallet in 3 easy steps
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Step Instructions */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-accent-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">
                      Create Polymarket Account
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Go to polymarket.com and create your account
                    </p>
                    <a
                      href="https://polymarket.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent-primary hover:text-accent-hover mt-2"
                    >
                      Open Polymarket
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-accent-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">
                      Get Your Wallet Details
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      In Polymarket, go to Settings → Wallet to find:
                    </p>
                    <ul className="text-xs text-text-secondary mt-2 space-y-1 list-disc list-inside">
                      <li>Your private key (click "Export Private Key")</li>
                      <li>Your deposit address (the wallet address shown in Polymarket)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-accent-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">
                      Fund Your Polymarket Wallet
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Deposit USDC on Polymarket using any of their supported methods:
                    </p>
                    <ul className="text-xs text-text-secondary mt-2 space-y-1 list-disc list-inside">
                      <li>Credit/Debit Card (easiest)</li>
                      <li>Bank Transfer</li>
                      <li>Crypto Transfer (USDC on Polygon)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="p-4 bg-positive/10 border border-positive/30 rounded-lg">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-positive flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-text-primary mb-1">
                      ✨ No Gas Fees!
                    </p>
                    <p className="text-text-secondary text-xs">
                      With gasless mode, you don't need POL/MATIC. Polymarket handles all gas fees automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => setStep(2)}
              fullWidth
            >
              Continue to Setup
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Input Form */}
      {step === 2 && (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent-primary/20 rounded-lg">
                <Zap className="h-6 w-6 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Enter Wallet Details
                </h3>
                <p className="text-sm text-text-secondary">
                  Securely connect your Polymarket wallet
                </p>
              </div>
            </div>

            {/* Security Warning */}
            <div className="p-4 bg-negative/10 border border-negative/30 rounded-lg">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-negative flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-text-primary mb-1">
                    🔒 Security Notice
                  </p>
                  <ul className="text-text-secondary text-xs space-y-1 list-disc list-inside">
                    <li>Your private key is encrypted with AES-256</li>
                    <li>Stored securely in HashiCorp Vault</li>
                    <li>Never transmitted without encryption</li>
                    <li>Only you control your funds</li>
                  </ul>
                </div>
              </div>
            </div>

            <Input
              type="password"
              label="Private Key"
              placeholder="0x..."
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              helperText="Your Polymarket private key (starts with 0x)"
              leftIcon={<Shield className="h-4 w-4" />}
              disabled={loading}
              required
              fullWidth
            />

            <Input
              type="text"
              label="Polymarket Deposit Address"
              placeholder="0x..."
              value={fundingAddress}
              onChange={(e) => setFundingAddress(e.target.value)}
              helperText="The wallet address shown in your Polymarket account (used for deposits)"
              leftIcon={<Zap className="h-4 w-4" />}
              disabled={loading}
              required
              fullWidth
            />

            {twoFactorEnabled && (
              <Input
                type="text"
                label="2FA Code"
                placeholder="000000"
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                helperText="Enter your 6-digit 2FA code"
                leftIcon={<Shield className="h-4 w-4" />}
                disabled={loading}
                required
                fullWidth
              />
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                fullWidth
              >
                Connect Wallet
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
