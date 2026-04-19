'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { Lock } from 'lucide-react';

interface PasswordChangeFormProps {
  isOpen: boolean;
  onClose: () => void;
  requires2FA?: boolean;
}

export function PasswordChangeForm({
  isOpen,
  onClose,
  requires2FA = false,
}: PasswordChangeFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (requires2FA && totpCode.length !== 6) {
      setError('2FA code must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      await authApi.updatePassword(newPassword, totpCode || undefined);
      toast.success('Password updated successfully');
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setTotpCode('');
    setError('');
    onClose();
  };

  const getPasswordStrength = () => {
    if (newPassword.length === 0) return null;
    if (newPassword.length < 8) return { label: 'Too short', color: 'text-negative' };
    if (newPassword.length < 12) return { label: 'Fair', color: 'text-neutral' };
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return { label: 'Good', color: 'text-positive' };
    }
    return { label: 'Strong', color: 'text-positive' };
  };

  const strength = getPasswordStrength();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <Input
          type="password"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          leftIcon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
        />

        {/* Password strength */}
        {strength && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-tertiary">Password strength:</span>
            <span className={`font-medium ${strength.color}`}>{strength.label}</span>
          </div>
        )}

        {/* Confirm Password */}
        <Input
          type="password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          leftIcon={<Lock className="h-4 w-4" />}
          autoComplete="new-password"
        />

        {/* 2FA Code */}
        <Input
          type="text"
          label={requires2FA ? "2FA Code (Required)" : "2FA Code (If Enabled)"}
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit code"
          helperText={requires2FA ? "Enter your 6-digit 2FA code" : "Leave blank if 2FA is not enabled"}
          maxLength={6}
          required={requires2FA}
          fullWidth
        />

        {/* Error message */}
        {error && (
          <div className="p-3 bg-negative/10 border border-negative/30 rounded-lg text-sm text-negative">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1"
          >
            Change Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
