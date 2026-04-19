'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/utils/format';
import { toast } from '@/context/toast-context';
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';

interface DepositAddressProps {
  address: string;
  walletType?: 'eoa' | 'proxy';
  className?: string;
}

export function DepositAddress({ address, walletType = 'eoa', className }: DepositAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied to clipboard');

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={className}>
      <CardHeader
        title="Deposit Funds"
        subtitle={walletType === 'proxy'
          ? 'Your Polymarket deposit address — fund via Polymarket or direct transfer'
          : 'Send USDC or MATIC to this address'}
      />

      <CardBody>
        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG
                value={address}
                size={200}
                level="M"
                includeMargin
              />
            </div>
          </div>

          {/* Address Display */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Your Deposit Address
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-bg-tertiary rounded-md text-sm font-mono text-text-primary break-all">
                  {address}
                </code>
                <Button
                  variant="outlined"
                  size="md"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-positive" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Mobile friendly - show shortened address */}
              <p className="text-xs text-text-tertiary mt-2 md:hidden">
                {formatAddress(address)}
              </p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="p-4 bg-neutral/10 border border-neutral/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-neutral flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  Important Notice
                </h4>
                <ul className="text-xs text-text-secondary space-y-1">
                  {walletType === 'proxy' ? (
                    <>
                      <li>• Fund via Polymarket (Card, Bank, or Crypto)</li>
                      <li>• Or send USDC directly on Polygon network</li>
                      <li>• No POL/MATIC needed for gas fees</li>
                    </>
                  ) : (
                    <>
                      <li>• Only send USDC or MATIC on Polygon network</li>
                      <li>• Sending other tokens may result in permanent loss</li>
                      <li>• Deposits typically arrive within 1-5 minutes</li>
                      <li>• Minimum deposit: $10 USDC</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <span className="text-sm text-text-secondary">Network</span>
            <span className="text-sm font-medium text-text-primary">
              Polygon (MATIC)
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
