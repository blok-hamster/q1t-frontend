'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { PasswordChangeForm } from './password-change-form';
import { authApi, portfolioApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { ROUTES } from '@/lib/constants';
import { Shield, Lock, Key, AlertTriangle, Eye, EyeOff, Copy } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SecuritySettingsProps {
  twoFactorEnabled: boolean;
  onUpdate?: () => void;
}

export function SecuritySettings({ twoFactorEnabled, onUpdate }: SecuritySettingsProps) {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnable2FA = () => {
    router.push(ROUTES.SETUP_2FA);
  };

  const handleDisable2FA = async () => {
    if (!totpCode) {
      toast.error('Please enter your 2FA code');
      return;
    }

    setLoading(true);
    try {
      await authApi.disable2FA(totpCode);
      toast.success('2FA disabled successfully');
      setShowDisable2FAModal(false);
      setTotpCode('');
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealPrivateKey = async () => {
    if (!totpCode) {
      toast.error('Please enter your 2FA code');
      return;
    }

    setLoading(true);
    try {
      const { private_key } = await portfolioApi.getPrivateKey(totpCode);
      setPrivateKey(private_key);
      setTotpCode('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reveal private key');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrivateKey = () => {
    navigator.clipboard.writeText(privateKey);
    toast.success('Private key copied to clipboard');
  };

  return (
    <>
      <div className="bg-[#0F1215] border border-[#1B2026] select-none font-mono">
        {/* Header */}
        <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]/60">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#20B2AA]" />
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069] block">
                AUTHENTICATION & ACCESS
              </span>
              <h3 className="font-mono text-xs font-bold text-[#E1E4E8] mt-0.5 uppercase">
                ACCOUNT SECURITY & 2FA
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 font-mono text-xs">
          {/* 2FA Section */}
          <div className="flex items-center justify-between p-3 bg-[#080A0C] border border-[#1B2026] rounded-xs">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-xs border',
                  twoFactorEnabled
                    ? 'bg-[#20B2AA]/10 border-[#20B2AA]/30 text-[#20B2AA]'
                    : 'bg-[#16191E] border-[#1B2026] text-[#586069]'
                )}
              >
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#E1E4E8]">TWO-FACTOR AUTHENTICATION (2FA)</p>
                <p className="text-[10px] text-[#8B949E] uppercase font-bold mt-0.5">
                  {twoFactorEnabled
                    ? 'ACCOUNT PROTECTED WITH TOTP AUTHENTICATOR'
                    : 'ENHANCE SECURITY WITH GOOGLE/AUTHY AUTHENTICATOR'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[10px] font-bold uppercase px-2 py-0.5 border rounded-xs',
                  twoFactorEnabled
                    ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                    : 'bg-[#586069]/15 text-[#586069] border-[#586069]/30'
                )}
              >
                {twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
              </span>

              {twoFactorEnabled ? (
                <button
                  type="button"
                  onClick={() => setShowDisable2FAModal(true)}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase bg-[#E55353]/10 text-[#E55353] border border-[#E55353]/30 hover:bg-[#E55353]/20 transition-colors cursor-pointer rounded-xs"
                >
                  Disable
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnable2FA}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/30 hover:bg-[#20B2AA]/20 transition-colors cursor-pointer rounded-xs"
                >
                  Enable 2FA
                </button>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div className="flex items-center justify-between p-3 bg-[#080A0C] border border-[#1B2026] rounded-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#16191E] border border-[#1B2026] text-[#20B2AA] rounded-xs">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#E1E4E8]">ACCOUNT PASSWORD</p>
                <p className="text-[10px] text-[#8B949E] uppercase font-bold mt-0.5">
                  UPDATE LOGIN CREDENTIALS
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-2.5 py-1 text-[10px] font-bold uppercase bg-[#16191E] text-[#8B949E] border border-[#1B2026] hover:text-[#E1E4E8] hover:border-[#2A313A] transition-colors cursor-pointer rounded-xs"
            >
              Change Password
            </button>
          </div>

          {/* Private Key Reveal Section */}
          <div className="p-3 bg-[#E55353]/10 border border-[#E55353]/30 rounded-xs space-y-3">
            <div className="flex gap-2.5 items-start">
              <AlertTriangle className="h-4 w-4 text-[#E55353] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#E55353] uppercase text-[10px] tracking-wide">
                  REVEAL PRIVATE KEY
                </p>
                <p className="text-[#8B949E] text-xs mt-0.5">
                  Never share your private key. Anyone with this key can access your wallet funds.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPrivateKeyModal(true)}
              className="w-full py-1.5 bg-[#E55353]/15 text-[#E55353] border border-[#E55353]/30 font-bold uppercase hover:bg-[#E55353]/25 transition-colors cursor-pointer rounded-xs flex items-center justify-center gap-1.5"
            >
              <Key className="h-3.5 w-3.5" /> Reveal Private Key
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeForm
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        requires2FA={twoFactorEnabled}
      />

      {/* Disable 2FA Modal */}
      <Modal
        isOpen={showDisable2FAModal}
        onClose={() => {
          setShowDisable2FAModal(false);
          setTotpCode('');
        }}
        title="DISABLE TWO-FACTOR AUTHENTICATION"
        size="md"
      >
        <div className="space-y-4 font-mono text-xs">
          <p className="text-[#8B949E]">
            Are you sure you want to disable 2FA? This will reduce your account security level.
          </p>

          <div className="space-y-1">
            <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em]">
              2FA CODE
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

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowDisable2FAModal(false);
                setTotpCode('');
              }}
              className="flex-1 py-1.5 bg-[#16191E] text-[#8B949E] border border-[#1B2026] font-bold uppercase hover:text-[#E1E4E8] transition-colors rounded-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDisable2FA}
              disabled={loading || totpCode.length !== 6}
              className="flex-1 py-1.5 bg-[#E55353]/15 text-[#E55353] border border-[#E55353]/30 font-bold uppercase hover:bg-[#E55353]/25 transition-colors disabled:opacity-40 rounded-xs"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      </Modal>

      {/* Private Key Modal */}
      <Modal
        isOpen={showPrivateKeyModal}
        onClose={() => {
          setShowPrivateKeyModal(false);
          setPrivateKey('');
          setTotpCode('');
          setShowPrivateKey(false);
        }}
        title="REVEAL PRIVATE KEY"
        size="md"
      >
        <div className="space-y-4 font-mono text-xs">
          {!privateKey ? (
            <>
              <div className="p-3 bg-[#E55353]/10 border border-[#E55353]/30 rounded-xs space-y-1">
                <p className="font-bold text-[#E55353] text-[10px] uppercase">WARNING</p>
                <p className="text-[#8B949E] text-xs">
                  Ensure no one is viewing your screen before revealing your key.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em]">
                  2FA CODE
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

              <button
                onClick={handleRevealPrivateKey}
                disabled={loading || totpCode.length !== 6}
                className="w-full py-2 bg-[#E55353]/15 text-[#E55353] border border-[#E55353]/30 font-bold uppercase hover:bg-[#E55353]/25 transition-colors disabled:opacity-40 cursor-pointer rounded-xs"
              >
                Reveal Private Key
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em]">
                  YOUR PRIVATE KEY
                </label>
                <div className="relative">
                  <input
                    type={showPrivateKey ? 'text' : 'password'}
                    value={privateKey}
                    readOnly
                    className="w-full px-3 py-2 pr-16 bg-[#080A0C] border border-[#1B2026] text-[#E1E4E8] font-mono text-xs rounded-xs"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="p-1 hover:text-[#20B2AA] text-[#8B949E]"
                    >
                      {showPrivateKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={handleCopyPrivateKey} className="p-1 hover:text-[#20B2AA] text-[#8B949E]">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowPrivateKeyModal(false);
                  setPrivateKey('');
                  setShowPrivateKey(false);
                }}
                className="w-full py-1.5 bg-[#16191E] text-[#8B949E] border border-[#1B2026] font-bold uppercase hover:text-[#E1E4E8] transition-colors rounded-xs"
              >
                Close
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
