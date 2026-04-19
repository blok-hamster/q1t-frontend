'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/modal';
import { toast } from '@/context/toast-context';
import { portfolioApi } from '@/lib/api';
import { isValidEthereumAddress } from '@/lib/utils/validation';
import { formatCurrency } from '@/lib/utils/format';
import { ApiException } from '@/types/api';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface WithdrawFormProps {
  availableBalance: number;
  requires2FA?: boolean;
  className?: string;
}

export function WithdrawForm({
  availableBalance,
  requires2FA = false,
  className,
}: WithdrawFormProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    toAddress: '',
    amount: '',
    totpCode: '',
  });

  const [errors, setErrors] = useState({
    toAddress: '',
    amount: '',
    totpCode: '',
  });

  const estimatedFee = 0.5; // Mock fee
  const amountNum = parseFloat(formData.amount) || 0;
  const totalWithFee = amountNum + estimatedFee;
  const willReceive = amountNum - estimatedFee;

  const validateForm = () => {
    const newErrors = {
      toAddress: '',
      amount: '',
      totpCode: '',
    };

    // Address validation
    if (!formData.toAddress) {
      newErrors.toAddress = 'Recipient address is required';
    } else if (!isValidEthereumAddress(formData.toAddress)) {
      newErrors.toAddress = 'Invalid Ethereum address';
    }

    // Amount validation
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (amountNum < 10) {
      newErrors.amount = 'Minimum withdrawal is $10';
    } else if (totalWithFee > availableBalance) {
      newErrors.amount = 'Insufficient balance (including fees)';
    }

    // 2FA validation
    if (requires2FA && !formData.totpCode) {
      newErrors.totpCode = '2FA code is required';
    } else if (requires2FA && !/^\d{6}$/.test(formData.totpCode)) {
      newErrors.totpCode = '2FA code must be 6 digits';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmWithdraw = async () => {
    setLoading(true);

    try {
      const response = await portfolioApi.withdraw(
        formData.toAddress,
        amountNum,
        requires2FA ? formData.totpCode : undefined
      );

      toast.success('Withdrawal initiated successfully!');
      toast.success(`Transaction: ${response.txHash.slice(0, 10)}...`);

      // Reset form
      setFormData({ toAddress: '', amount: '', totpCode: '' });
      setShowConfirm(false);
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 403) {
          toast.error('Insufficient balance');
        } else if (error.statusCode === 401) {
          setErrors({ ...errors, totpCode: 'Invalid 2FA code' });
          toast.error('Invalid 2FA code');
        } else {
          toast.error(error.error || 'Withdrawal failed');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    const maxAmount = Math.max(0, availableBalance - estimatedFee);
    setFormData({ ...formData, amount: maxAmount.toFixed(2) });
  };

  return (
    <>
      <Card className={className}>
        <CardHeader
          title="Withdraw Funds"
          subtitle="Send USDC to an external wallet"
        />

        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipient Address */}
            <Input
              type="text"
              label="Recipient Address"
              placeholder="0x..."
              value={formData.toAddress}
              onChange={(e) =>
                setFormData({ ...formData, toAddress: e.target.value })
              }
              error={errors.toAddress}
              helperText="Polygon network address only"
              disabled={loading}
              required
              fullWidth
            />

            {/* Amount */}
            <div className="space-y-2">
              <Input
                type="number"
                label="Amount (USD)"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                error={errors.amount}
                disabled={loading}
                required
                fullWidth
                rightIcon={
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="text-accent-primary hover:text-accent-hover text-xs font-medium"
                  >
                    MAX
                  </button>
                }
              />

              <div className="text-xs text-text-secondary space-y-1">
                <div className="flex justify-between">
                  <span>Available Balance:</span>
                  <span className="font-mono">{formatCurrency(availableBalance)}</span>
                </div>
                {amountNum > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Estimated Fee:</span>
                      <span className="font-mono">{formatCurrency(estimatedFee)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-text-primary">
                      <span>You'll Receive:</span>
                      <span className="font-mono">{formatCurrency(willReceive)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2FA Code */}
            <Input
              type="text"
              label={requires2FA ? "2FA Code (Required)" : "2FA Code (If Enabled)"}
              placeholder="000000"
              value={formData.totpCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  totpCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                })
              }
              error={errors.totpCode}
              helperText={requires2FA ? "Enter your 6-digit 2FA code" : "Leave blank if 2FA is not enabled"}
              disabled={loading}
              required={requires2FA}
              fullWidth
            />

            {/* Warning */}
            <div className="p-4 bg-negative/10 border border-negative/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-negative flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-negative mb-1">
                    Warning
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Withdrawals are irreversible. Please double-check the
                    recipient address and amount before confirming.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              fullWidth
            >
              Withdraw {amountNum > 0 && formatCurrency(amountNum)}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmWithdraw}
        title="Confirm Withdrawal"
        description={`You are about to withdraw ${formatCurrency(amountNum)} USDC to ${formData.toAddress.slice(0, 10)}...${formData.toAddress.slice(-8)}. This action cannot be undone.`}
        confirmText="Confirm Withdrawal"
        cancelText="Cancel"
        variant="danger"
        loading={loading}
      />
    </>
  );
}
