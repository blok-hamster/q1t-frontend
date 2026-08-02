'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatAddress } from '@/lib/utils/format';
import { toast } from '@/context/toast-context';
import { Copy, Check, ShieldCheck, AlertTriangle, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
    <div className={cn('bg-[#0F1215] border border-[#1B2026] select-none font-mono text-xs', className)}>
      {/* Header Bar */}
      <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]">
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4 text-[#20B2AA]" />
          <h3 className="text-xs font-bold text-[#E1E4E8] uppercase tracking-wider">
            DEPOSIT FUNDS (POLYMARKET SETTLEMENT)
          </h3>
        </div>
        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/30 rounded-xs">
          POLYGON NETWORK
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* QR Code & Address Display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* QR Code */}
          <div className="flex justify-center sm:justify-start">
            <div className="p-2.5 bg-white border border-[#1B2026] rounded-xs shadow-sm">
              <QRCodeSVG value={address} size={130} level="M" includeMargin={false} />
            </div>
          </div>

          {/* Address Details & Copy Button */}
          <div className="sm:col-span-2 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-[#586069] uppercase tracking-[0.12em] block mb-1">
                YOUR DEPOSIT ADDRESS
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-[#080A0C] border border-[#1B2026] text-[#E1E4E8] font-mono text-xs break-all rounded-xs">
                  {address}
                </code>
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-[#16191E] border border-[#1B2026] hover:border-[#20B2AA] text-[#E1E4E8] transition-colors rounded-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#20B2AA]" />
                      <span className="text-[#20B2AA] font-bold">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#8B949E]" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#080A0C] border border-[#1B2026] text-[10px] text-[#8B949E]">
              <span>WALLET MODE</span>
              <span className="text-[#E1E4E8] font-bold uppercase">{walletType} DEPOSIT WALLET</span>
            </div>
          </div>
        </div>

        {/* Deposit Guidelines Notice */}
        <div className="p-3 bg-[#080A0C] border border-[#1B2026] space-y-1.5">
          <div className="flex items-center gap-2 text-[#D99B00]">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">NETWORK DEPOSIT NOTICE</span>
          </div>
          <ul className="text-[11px] text-[#8B949E] space-y-1 pl-4 list-disc">
            <li>Send <strong>USDC (Polygon)</strong> or <strong>POL (MATIC)</strong> for trading and gas settlement.</li>
            <li>Withdrawals are processed directly via your <strong>Polymarket Account</strong>.</li>
            <li>Deposits typically reflect within 1–3 minutes after network confirmation.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
