'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { PasswordChangeForm } from './password-change-form';
import { authApi } from '@/lib/api';
import { portfolioApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { ROUTES } from '@/lib/constants';
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';

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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-accent-primary" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Security Settings
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Manage your account security
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* 2FA Section */}
          <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                twoFactorEnabled ? 'bg-positive/20' : 'bg-text-tertiary/20'
              }`}>
                <Shield className={`h-5 w-5 ${
                  twoFactorEnabled ? 'text-positive' : 'text-text-tertiary'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {twoFactorEnabled
                    ? 'Your account is protected with 2FA'
                    : 'Add an extra layer of security'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={twoFactorEnabled ? 'success' : 'neutral'} size="sm">
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              {twoFactorEnabled ? (
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  onClick={() => setShowDisable2FAModal(true)}
                >
                  Disable
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleEnable2FA}
                >
                  Enable
                </Button>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent-primary/20">
                <Lock className="h-5 w-5 text-accent-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Password</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Change your account password
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outlined"
              size="sm"
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </Button>
          </div>

          {/* Private Key Section */}
          <div className="p-4 bg-negative/10 border border-negative/30 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-negative flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Wallet Private Key
                </p>
                <p className="text-xs text-text-secondary">
                  Your private key gives full access to your wallet. Never share it with
                  anyone. Only reveal if you need to import your wallet elsewhere.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setShowPrivateKeyModal(true)}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Reveal Private Key
            </Button>
          </div>
        </CardBody>
      </Card>

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
        title="Disable Two-Factor Authentication"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-neutral/10 border border-neutral/30 rounded-lg text-sm">
            <p className="text-text-primary">
              Are you sure you want to disable 2FA? This will make your account less
              secure.
            </p>
          </div>

          <Input
            type="text"
            label="2FA Code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDisable2FAModal(false);
                setTotpCode('');
              }}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDisable2FA}
              loading={loading}
              className="flex-1"
            >
              Disable 2FA
            </Button>
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
        title="Reveal Private Key"
        size="md"
      >
        <div className="space-y-4">
          {!privateKey ? (
            <>
              <div className="p-3 bg-negative/10 border border-negative/30 rounded-lg">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="h-5 w-5 text-negative flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-negative mb-1">Warning!</p>
                    <ul className="space-y-1 text-text-secondary text-xs">
                      <li>• Never share your private key with anyone</li>
                      <li>• Anyone with your private key can access your funds</li>
                      <li>• Make sure no one is watching your screen</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Input
                type="text"
                label="2FA Code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                helperText={twoFactorEnabled ? "Enter your 2FA code to continue" : "Enter your 2FA code (required for security)"}
                leftIcon={<Shield className="h-4 w-4" />}
                required
                fullWidth
              />

              <Button
                variant="danger"
                onClick={handleRevealPrivateKey}
                loading={loading}
                disabled={totpCode.length !== 6}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                I Understand, Reveal Key
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-primary">
                  Your Private Key
                </label>
                <div className="relative">
                  <input
                    type={showPrivateKey ? 'text' : 'password'}
                    value={privateKey}
                    readOnly
                    className="w-full px-4 py-3 pr-20 bg-bg-tertiary border border-border rounded-lg font-mono text-xs text-text-primary"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="p-2 hover:bg-bg-primary rounded transition-colors"
                    >
                      {showPrivateKey ? (
                        <EyeOff className="h-4 w-4 text-text-secondary" />
                      ) : (
                        <Eye className="h-4 w-4 text-text-secondary" />
                      )}
                    </button>
                    <button
                      onClick={handleCopyPrivateKey}
                      className="p-2 hover:bg-bg-primary rounded transition-colors"
                    >
                      <Copy className="h-4 w-4 text-text-secondary" />
                    </button>
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={() => {
                  setShowPrivateKeyModal(false);
                  setPrivateKey('');
                  setShowPrivateKey(false);
                }}
                className="w-full"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
