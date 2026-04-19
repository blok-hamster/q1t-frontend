'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { AlertTriangle } from 'lucide-react';

interface SuspendUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onSuccess?: () => void;
}

export function SuspendUserModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onSuccess,
}: SuspendUserModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuspend = async () => {
    setLoading(true);
    try {
      await adminApi.suspendUser(userId, reason || undefined);
      toast.success(`User ${userEmail} suspended successfully`);
      setReason('');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Suspend User Account"
      size="md"
    >
      <div className="space-y-4">
        <div className="p-4 bg-negative/10 border border-negative/30 rounded-lg">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-negative flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-negative mb-1">Warning</p>
              <p className="text-text-secondary mb-2">
                Suspending <span className="font-mono font-medium">{userEmail}</span> will:
              </p>
              <ul className="list-disc list-inside text-text-secondary text-xs space-y-1">
                <li>Prevent login to the platform</li>
                <li>Disable all trading activity</li>
                <li>Lock access to their portfolio</li>
              </ul>
            </div>
          </div>
        </div>

        <Input
          type="text"
          label="Reason (Optional)"
          placeholder="e.g., Suspicious activity, policy violation..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          helperText="This will be logged for audit purposes"
          disabled={loading}
          fullWidth
        />

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
            variant="danger"
            onClick={handleSuspend}
            loading={loading}
            className="flex-1"
          >
            Suspend User
          </Button>
        </div>
      </div>
    </Modal>
  );
}
