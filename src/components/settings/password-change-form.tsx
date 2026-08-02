'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="CHANGE PASSWORD" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs select-none">
        <div className="space-y-1">
          <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em]">
            NEW PASSWORD
          </label>
          <div className="relative">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters..."
              className="w-full px-3 py-2 bg-[#080A0C] border border-[#1B2026] text-[#E1E4E8] font-mono text-xs focus:border-[#20B2AA] focus:outline-none rounded-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em]">
            CONFIRM NEW PASSWORD
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password..."
            className="w-full px-3 py-2 bg-[#080A0C] border border-[#1B2026] text-[#E1E4E8] font-mono text-xs focus:border-[#20B2AA] focus:outline-none rounded-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-[#586069] font-bold uppercase tracking-[0.12em]">
            {requires2FA ? '2FA CODE (REQUIRED)' : '2FA CODE (IF ENABLED)'}
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

        {error && (
          <div className="p-2.5 bg-[#E55353]/10 border border-[#E55353]/30 text-[#E55353] text-xs font-bold rounded-xs">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-1.5 bg-[#16191E] text-[#8B949E] border border-[#1B2026] font-bold uppercase hover:text-[#E1E4E8] transition-colors rounded-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="flex-1 py-1.5 bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA]/30 font-bold uppercase hover:bg-[#20B2AA]/20 transition-colors disabled:opacity-40 rounded-xs"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
