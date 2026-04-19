'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { CheckCircle, Info } from 'lucide-react';

interface ReactivateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onSuccess?: () => void;
}

export function ReactivateUserModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onSuccess,
}: ReactivateUserModalProps) {
  const [loading, setLoading] = useState(false);

  const handleReactivate = async () => {
    setLoading(true);
    try {
      await adminApi.reactivateUser(userId);
      toast.success(`User ${userEmail} reactivated successfully`);
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reactivate user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reactivate User Account"
      size="md"
    >
      <div className="space-y-4">
        <div className="p-4 bg-positive/10 border border-positive/30 rounded-lg">
          <div className="flex gap-3 items-start">
            <CheckCircle className="h-5 w-5 text-positive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-positive mb-1">Reactivate Account</p>
              <p className="text-text-secondary mb-2">
                Reactivating <span className="font-mono font-medium">{userEmail}</span> will:
              </p>
              <ul className="list-disc list-inside text-text-secondary text-xs space-y-1">
                <li>Allow login to the platform</li>
                <li>Restore access to their portfolio</li>
                <li>Set account status to "Active"</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-3 bg-neutral/10 border border-neutral/30 rounded-lg">
          <div className="flex gap-2 items-start">
            <Info className="h-4 w-4 text-neutral flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              Note: Trading will remain disabled. The user must manually enable trading
              in their settings.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleReactivate}
            loading={loading}
            className="flex-1"
          >
            Reactivate User
          </Button>
        </div>
      </div>
    </Modal>
  );
}
