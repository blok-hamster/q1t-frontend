'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/context/toast-context';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { ApiException } from '@/types/api';
import { ROUTES } from '@/lib/constants';
import { Shield, Copy, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Setup2FAPage() {
  const { isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const [twoFactorData, setTwoFactorData] = useState<{
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
  } | null>(null);

  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  // Fetch 2FA setup data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    const fetchSetupData = async () => {
      try {
        const data = await authApi.setup2FA();
        setTwoFactorData(data);
      } catch (error) {
        if (error instanceof ApiException) {
          toast.error(error.error || 'Failed to setup 2FA');
        }
        router.push(ROUTES.SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSetupData();
  }, [isAuthenticated, router]);

  const handleCopySecret = () => {
    if (!twoFactorData) return;

    navigator.clipboard.writeText(twoFactorData.manualEntryKey);
    setCopied(true);
    toast.success('Secret key copied to clipboard');

    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(verificationCode)) {
      setError('Code must be 6 digits');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      await authApi.verify2FA(verificationCode);
      await refreshUser();
      toast.success('2FA enabled successfully!');
      router.push(ROUTES.SETTINGS);
    } catch (error) {
      if (error instanceof ApiException) {
        setError('Invalid verification code. Please try again.');
        toast.error(error.error || 'Verification failed');
      }
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!twoFactorData) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(ROUTES.SETTINGS)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>

      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-accent-primary" />
              <span>Setup Two-Factor Authentication</span>
            </div>
          }
          subtitle="Secure your account with 2FA"
        />

        <CardBody>
          <div className="space-y-6">
            {/* Step 1: Scan QR Code */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Step 1: Scan QR Code
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, or similar)
              </p>

              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={twoFactorData.qrCodeUrl}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
            </div>

            {/* Manual Entry */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Or enter manually
              </h3>
              <p className="text-sm text-text-secondary mb-2">
                If you can't scan the QR code, enter this key manually:
              </p>

              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-bg-tertiary rounded-md text-sm font-mono text-text-primary break-all">
                  {twoFactorData.manualEntryKey}
                </code>
                <Button
                  type="button"
                  variant="outlined"
                  size="md"
                  onClick={handleCopySecret}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-positive" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Step 2: Verify */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Step 2: Verify Code
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Enter the 6-digit code from your authenticator app to verify
                setup
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  type="text"
                  label="Verification Code"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setError('');
                  }}
                  error={error}
                  leftIcon={<Shield className="h-4 w-4" />}
                  disabled={verifying}
                  required
                  fullWidth
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push(ROUTES.SETTINGS)}
                    disabled={verifying}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={verifying}
                    fullWidth
                  >
                    Verify & Enable 2FA
                  </Button>
                </div>
              </form>
            </div>

            {/* Info box */}
            <div className="p-4 bg-accent-muted rounded-md border border-accent-primary/50">
              <h4 className="text-sm font-semibold text-accent-primary mb-1">
                Keep your secret safe
              </h4>
              <p className="text-xs text-text-secondary">
                Store this secret key securely. You'll need it to recover
                your account if you lose access to your authenticator app.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
