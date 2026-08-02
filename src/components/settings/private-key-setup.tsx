'use client';

import { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { Key, Shield, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PrivateKeySetupProps {
  twoFactorEnabled: boolean;
  onUpdate?: () => void;
}

export function PrivateKeySetup({ twoFactorEnabled, onUpdate }: PrivateKeySetupProps) {
  const [privateKey, setPrivateKey] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [walletType, setWalletType] = useState<'eoa' | 'proxy'>('proxy');
  const [fundingAddress, setFundingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    hasPrivateKey: boolean;
    wallet_address?: string;
    wallet_type?: 'eoa' | 'proxy';
    proxy_wallet_address?: string;
    polymarket_funding_address?: string;
  }>({ hasPrivateKey: false });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setChecking(true);
    try {
      const data = await settingsApi.hasPrivateKey();
      setStatus(data);
      if (data.wallet_type) {
        setWalletType(data.wallet_type);
      }
    } catch (error) {
      console.error('Failed to check private key status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!privateKey.trim()) {
      toast.error('Please enter a private key');
      return;
    }

    if (twoFactorEnabled && !totpCode.trim()) {
      toast.error('2FA code is required');
      return;
    }

    setLoading(true);

    try {
      const data = await settingsApi.storePrivateKey({
        private_key: privateKey.trim(),
        totp_code: twoFactorEnabled ? totpCode.trim() : undefined,
        wallet_type: walletType,
        polymarket_funding_address: fundingAddress.trim() || undefined,
      });

      toast.success(data.message || 'Wallet & Private key stored securely in Vault');
      setPrivateKey('');
      setTotpCode('');
      await fetchStatus();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to store private key');
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
          <Key className="h-4 w-4 text-[#20B2AA]" />
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069] block">
              VAULT SECURITY
            </span>
            <h3 className="font-mono text-xs font-bold text-[#E1E4E8] mt-0.5 uppercase">
              WALLET & PRIVATE KEY CONFIGURATION
            </h3>
          </div>
        </div>
        <span
          className={cn(
            'font-mono text-[10px] font-bold uppercase px-2 py-0.5 border rounded-xs',
            status.hasPrivateKey
              ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
              : 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30'
          )}
        >
          {status.hasPrivateKey ? '● VAULT STORED' : '○ KEY MISSING'}
        </span>
      </div>

      <div className="p-4 space-y-4 font-mono text-xs">
        {status.hasPrivateKey ? (
          <div className="p-3 bg-[#20B2AA]/10 border border-[#20B2AA]/30 space-y-2 rounded-xs">
            <div className="flex items-center gap-2 text-[#20B2AA] font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>WALLET SECURELY STORED IN HASHICORP VAULT</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#20B2AA]/20">
              <div>
                <span className="text-[#586069] font-bold uppercase block">WALLET MODE:</span>
                <span className="text-[#E1E4E8] font-bold uppercase">
                  {status.wallet_type === 'proxy' ? 'PROXY SAFE (GASLESS)' : 'DIRECT EOA'}
                </span>
              </div>
              {status.wallet_address && (
                <div>
                  <span className="text-[#586069] font-bold uppercase block">EOA ADDRESS:</span>
                  <span className="text-[#E1E4E8] font-bold tabular-nums">
                    {status.wallet_address}
                  </span>
                </div>
              )}
              {status.proxy_wallet_address && (
                <div>
                  <span className="text-[#586069] font-bold uppercase block">CLOB SAFE ADDRESS:</span>
                  <span className="text-[#E1E4E8] font-bold tabular-nums">
                    {status.proxy_wallet_address}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Wallet Mode Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em] block">
                WALLET EXECUTION MODE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWalletType('proxy')}
                  className={cn(
                    'p-2.5 border text-left cursor-pointer transition-colors rounded-xs',
                    walletType === 'proxy'
                      ? 'bg-[#16191E] border-[#20B2AA]/50 text-[#E1E4E8]'
                      : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E]'
                  )}
                >
                  <div className="font-bold text-xs">PROXY SAFE (RECOMMENDED)</div>
                  <div className="text-[10px] text-[#8B949E] mt-0.5">Gasless execution via Polymarket Safe</div>
                </button>

                <button
                  type="button"
                  onClick={() => setWalletType('eoa')}
                  className={cn(
                    'p-2.5 border text-left cursor-pointer transition-colors rounded-xs',
                    walletType === 'eoa'
                      ? 'bg-[#16191E] border-[#20B2AA]/50 text-[#E1E4E8]'
                      : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E]'
                  )}
                >
                  <div className="font-bold text-xs">DIRECT EOA</div>
                  <div className="text-[10px] text-[#8B949E] mt-0.5">Direct execution (requires POL gas)</div>
                </button>
              </div>
            </div>

            {/* Private Key Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em] block">
                PRIVATE KEY (64-HEX CHARACTERS)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-[#080A0C] border border-[#1B2026] text-[#E1E4E8] font-mono text-xs focus:border-[#20B2AA] focus:outline-none rounded-xs"
                />
              </div>
            </div>

            {/* Funding Address Optional Input */}
            {walletType === 'proxy' && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em] block">
                  POLYMARKET DEPOSIT ADDRESS (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={fundingAddress}
                  onChange={(e) => setFundingAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-[#080A0C] border border-[#1B2026] text-[#E1E4E8] font-mono text-xs focus:border-[#20B2AA] focus:outline-none rounded-xs"
                />
              </div>
            )}

            {/* 2FA Code if enabled */}
            {twoFactorEnabled && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em] block">
                  2FA AUTHENTICATION CODE
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code..."
                  maxLength={6}
                  className="w-full px-3 py-2 bg-[#080A0C] border border-[#1B2026] text-[#E1E4E8] font-mono text-xs focus:border-[#20B2AA] focus:outline-none rounded-xs"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !privateKey.trim()}
              className="w-full py-2 bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/30 font-bold uppercase hover:bg-[#20B2AA]/20 transition-colors disabled:opacity-40 cursor-pointer rounded-xs"
            >
              {loading ? 'Encrypting & Storing in Vault...' : 'Save Private Key to Vault'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
