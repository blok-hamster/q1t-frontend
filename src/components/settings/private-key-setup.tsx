'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { WalletTypeSelector } from './wallet-type-selector';
import { ProxyWalletSetup } from './proxy-wallet-setup';
import {
  Key,
  AlertTriangle,
  CheckCircle,
  Shield,
  ExternalLink,
  Zap,
  Wallet,
} from 'lucide-react';

interface PrivateKeySetupProps {
  twoFactorEnabled: boolean;
  onUpdate?: () => void;
}

export function PrivateKeySetup({
  twoFactorEnabled,
  onUpdate,
}: PrivateKeySetupProps) {
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletType, setWalletType] = useState<'eoa' | 'proxy'>('proxy'); // Default to gasless
  const [proxyWalletAddress, setProxyWalletAddress] = useState<string>(''); // Derived Safe (CLOB)
  const [polymarketFundingAddress, setPolymarketFundingAddress] = useState<string>(''); // Deposit address
  const [showModal, setShowModal] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<'eoa' | 'proxy'>('proxy');

  // EOA fields
  const [privateKey, setPrivateKey] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkPrivateKey();
  }, []);

  const checkPrivateKey = async () => {
    setChecking(true);
    try {
      const data = await settingsApi.checkPrivateKey();
      setHasPrivateKey(data.hasPrivateKey);
      setWalletAddress(data.wallet_address || '');
      setWalletType((data.wallet_type as 'eoa' | 'proxy') || 'eoa');
      setProxyWalletAddress(data.proxy_wallet_address || '');
      setPolymarketFundingAddress(data.polymarket_funding_address || '');
    } catch (error) {
      console.error('Failed to check private key:', error);
    } finally {
      setChecking(false);
    }
  };

  const validatePrivateKey = (key: string): boolean => {
    if (!key.startsWith('0x')) {
      setError('Private key must start with 0x');
      return false;
    }

    if (key.length !== 66) {
      setError('Private key must be 66 characters (0x + 64 hex digits)');
      return false;
    }

    if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
      setError('Invalid private key format');
      return false;
    }

    return true;
  };

  const handleEOASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePrivateKey(privateKey)) {
      return;
    }

    if (twoFactorEnabled && !totpCode) {
      setError('2FA code is required');
      return;
    }

    setLoading(true);

    try {
      const data = await settingsApi.storePrivateKey(
        privateKey,
        'eoa',
        undefined, // no proxy address for EOA
        twoFactorEnabled ? totpCode : undefined
      );

      toast.success('EOA wallet connected successfully!');
      setWalletAddress(data.wallet_address);
      setWalletType('eoa');
      setHasPrivateKey(true);
      setShowModal(false);
      setPrivateKey('');
      setTotpCode('');

      onUpdate?.();
    } catch (error: any) {
      setError(error.message || 'Failed to store private key');
      toast.error(error.message || 'Failed to store private key');
    } finally {
      setLoading(false);
    }
  };

  const handleProxySubmit = async (data: {
    privateKey: string;
    fundingAddress: string;
    totpCode?: string;
  }) => {
    setLoading(true);
    setError('');

    try {
      const result = await settingsApi.storePrivateKey(
        data.privateKey,
        'proxy',
        data.fundingAddress,
        data.totpCode
      );

      toast.success('Gasless wallet connected successfully!');
      setWalletAddress(result.wallet_address);
      setWalletType('proxy');
      setProxyWalletAddress(result.proxy_wallet_address || '');
      setPolymarketFundingAddress(result.polymarket_funding_address || '');
      setHasPrivateKey(true);
      setShowModal(false);

      onUpdate?.();
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
      toast.error(error.message || 'Failed to connect wallet');
      throw error; // Re-throw so ProxyWalletSetup can handle it
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setError('');
    setPrivateKey('');
    setTotpCode('');
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
    <>
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            {walletType === 'proxy' ? (
              <Zap className="h-5 w-5 text-accent-primary" />
            ) : (
              <Key className="h-5 w-5 text-accent-primary" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary">
                Wallet Management
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {hasPrivateKey
                  ? `Connected with ${walletType === 'proxy' ? 'Gasless' : 'EOA'} mode`
                  : 'Connect your wallet to enable trading'}
              </p>
            </div>
            {hasPrivateKey && (
              <Badge variant="success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {hasPrivateKey ? (
            <div className="space-y-4">
              {/* Wallet Type Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">Wallet Type:</span>
                <Badge variant={walletType === 'proxy' ? 'success' : 'default'}>
                  {walletType === 'proxy' ? (
                    <>
                      <Zap className="h-3 w-3 mr-1" />
                      Gasless
                    </>
                  ) : (
                    <>
                      <Wallet className="h-3 w-3 mr-1" />
                      EOA
                    </>
                  )}
                </Badge>
              </div>

              {/* Derived Wallet Address */}
              <div className="p-4 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary mb-1">
                  Derived Wallet Address
                </p>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-text-primary">
                    {walletAddress}
                  </code>
                  <a
                    href={`https://polygonscan.com/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:text-accent-hover ml-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Polymarket Deposit Address (funding address from Polymarket UI) */}
              {walletType === 'proxy' && polymarketFundingAddress && (
                <div className="p-4 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
                  <p className="text-xs text-text-tertiary mb-1">
                    Polymarket Deposit Address
                  </p>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-text-primary">
                      {polymarketFundingAddress}
                    </code>
                    <a
                      href={`https://polygonscan.com/address/${polymarketFundingAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-primary hover:text-accent-hover ml-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    Fund this address via Polymarket to add trading capital
                  </p>
                </div>
              )}

              {/* CLOB Safe Address (auto-derived, used for trading) */}
              {walletType === 'proxy' && proxyWalletAddress && (
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <p className="text-xs text-text-tertiary mb-1">
                    CLOB Trading Address (auto-derived)
                  </p>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-text-primary">
                      {proxyWalletAddress}
                    </code>
                    <a
                      href={`https://polygonscan.com/address/${proxyWalletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-primary hover:text-accent-hover ml-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    Gnosis Safe used internally for order signing
                  </p>
                </div>
              )}

              {/* Funding Instructions */}
              <div
                className={`p-4 border rounded-lg ${
                  walletType === 'proxy'
                    ? 'bg-positive/10 border-positive/30'
                    : 'bg-neutral/10 border-neutral/30'
                }`}
              >
                <div className="flex gap-3">
                  {walletType === 'proxy' ? (
                    <Zap className="h-5 w-5 text-positive flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-neutral flex-shrink-0" />
                  )}
                  <div className="text-sm">
                    <p className="font-medium text-text-primary mb-2">
                      {walletType === 'proxy' ? '✅ Ready to Trade!' : '⚠️ Funding Required'}
                    </p>
                    {walletType === 'proxy' ? (
                      <div className="space-y-2 text-xs text-text-secondary">
                        <p>Fund your Polymarket account directly:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Go to polymarket.com</li>
                          <li>Click "Deposit" in your wallet</li>
                          <li>Add USDC using any supported method</li>
                          <li>Start trading! (No POL needed)</li>
                        </ol>
                        <a
                          href="https://polymarket.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent-primary hover:text-accent-hover mt-2"
                        >
                          Open Polymarket
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs text-text-secondary">
                        <p>Send funds to your wallet address:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Send 2-3 POL for gas fees</li>
                          <li>Send USDC.e (Polygon) for trading</li>
                        </ul>
                        <p className="mt-2 text-xs text-text-tertiary italic">
                          Note: First trade will include USDC approval (~$0.01 POL)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-neutral/10 border border-neutral/30 rounded-lg">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-neutral flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-text-primary mb-1">
                      ⚠️ Wallet Required
                    </p>
                    <p className="text-text-secondary text-xs">
                      Connect your wallet to enable automated trading.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleOpenModal}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Wallet Setup Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Connect Wallet"
        size="lg"
      >
        <div className="space-y-6">
          {/* Wallet Type Selector */}
          <WalletTypeSelector
            selectedType={selectedWalletType}
            onSelect={setSelectedWalletType}
            disabled={loading}
          />

          {/* Conditional Form Based on Wallet Type */}
          {selectedWalletType === 'proxy' ? (
            <ProxyWalletSetup
              onSubmit={handleProxySubmit}
              twoFactorEnabled={twoFactorEnabled}
              loading={loading}
            />
          ) : (
            <Card padding="lg">
              <form onSubmit={handleEOASubmit} className="space-y-4">
                <div className="p-4 bg-negative/10 border border-negative/30 rounded-lg">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-negative flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-text-primary mb-1">
                        🔒 Security Warning
                      </p>
                      <ul className="text-text-secondary text-xs space-y-1 list-disc list-inside">
                        <li>Your key is encrypted with AES-256</li>
                        <li>Stored securely in HashiCorp Vault</li>
                        <li>You'll need to fund with POL + USDC.e</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Input
                  type="password"
                  label="Private Key"
                  placeholder="0x..."
                  value={privateKey}
                  onChange={(e) => {
                    setPrivateKey(e.target.value);
                    setError('');
                  }}
                  error={error}
                  helperText="Your Polygon wallet private key"
                  leftIcon={<Key className="h-4 w-4" />}
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
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={loading} fullWidth>
                    Connect EOA Wallet
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </Modal>
    </>
  );
}
