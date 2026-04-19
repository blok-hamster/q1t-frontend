'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { StatusBadge } from '@/components/admin/status-badge';
import { SuspendUserModal } from '@/components/admin/suspend-user-modal';
import { ReactivateUserModal } from '@/components/admin/reactivate-user-modal';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import { formatCurrency, formatTimeAgo, formatDate } from '@/lib/utils/format';
import type { UserDetail } from '@/types/admin';
import {
  ArrowLeft,
  Wallet,
  Shield,
  Key,
  Ban,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Activity,
  ExternalLink,
} from 'lucide-react';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [suspendModal, setSuspendModal] = useState(false);
  const [reactivateModal, setReactivateModal] = useState(false);

  const fetchUserDetail = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await adminApi.getUserDetail(userId);
      setUser(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load user details');
      router.push(ROUTES.ADMIN_USERS);
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);

  const handleModalSuccess = () => {
    fetchUserDetail();
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">User not found</p>
        <Link href={ROUTES.ADMIN_USERS}>
          <Button className="mt-4">Back to Users</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={ROUTES.ADMIN_USERS}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-primary font-mono">
                {user.email}
              </h1>
              {user.isAdmin && (
                <Badge variant="info">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-text-tertiary">
              User ID: {user._id}
            </p>
          </div>
        </div>

        {/* Actions */}
        {!user.isAdmin && (
          <div className="flex gap-3">
            {user.accountStatus === 'active' ? (
              <Button
                variant="danger"
                onClick={() => setSuspendModal(true)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Suspend User
              </Button>
            ) : user.accountStatus === 'suspended' ? (
              <Button
                variant="primary"
                onClick={() => setReactivateModal(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Reactivate User
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Status */}
        <Card>
          <CardHeader title="Account Status" />
          <CardBody className="space-y-4">
            <div>
              <p className="text-xs text-text-tertiary mb-2">Status</p>
              <StatusBadge status={user.accountStatus} size="md" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-2">Trading</p>
              <Badge variant={user.isActive ? 'success' : 'neutral'} size="md">
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-2">Member Since</p>
              <p className="text-sm text-text-primary">
                {formatDate(user.createdAt)}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {formatTimeAgo(user.createdAt)}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader title="Security" />
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">2FA</span>
              </div>
              <Badge variant={user.twoFactorEnabled ? 'success' : 'neutral'} size="sm">
                {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">Private Key</span>
              </div>
              <Badge variant={user.hasPrivateKey ? 'success' : 'neutral'} size="sm">
                {user.hasPrivateKey ? 'Stored' : 'Not Set'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">Wallet</span>
              </div>
              <Badge variant={user.wallet_address ? 'success' : 'neutral'} size="sm">
                {user.wallet_address ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Wallet Info */}
        <Card>
          <CardHeader title="Wallet Address" />
          <CardBody>
            {user.wallet_address ? (
              <div className="space-y-3">
                <div className="p-3 bg-bg-tertiary rounded-lg">
                  <p className="text-xs font-mono text-text-primary break-all">
                    {user.wallet_address}
                  </p>
                </div>
                <a
                  href={`https://polygonscan.com/address/${user.wallet_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-accent-primary hover:text-accent-hover"
                >
                  View on Polygonscan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-text-secondary py-4 text-center">
                No wallet connected
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Trade Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Trading Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-tertiary mb-1">Total Trades</p>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {user.tradeStats.total}
                </p>
              </div>
              <div className="p-2 bg-accent-muted rounded-lg">
                <BarChart3 className="h-5 w-5 text-accent-primary" />
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-tertiary mb-1">Filled</p>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {user.tradeStats.filled}
                </p>
              </div>
              <div className="p-2 bg-positive/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-positive" />
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-tertiary mb-1">Pending</p>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {user.tradeStats.pending}
                </p>
              </div>
              <div className="p-2 bg-neutral/20 rounded-lg">
                <Activity className="h-5 w-5 text-neutral" />
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-tertiary mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {formatCurrency(user.tradeStats.totalVolume, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="p-2 bg-accent-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-accent-primary" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Risk Configuration */}
      <Card>
        <CardHeader title="Risk Configuration" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-text-tertiary mb-1">Max Bet per Trade</p>
              <p className="text-lg font-semibold text-text-primary font-mono">
                {(user.riskConfig.max_bet_pct * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-1">Min AI Confidence</p>
              <p className="text-lg font-semibold text-text-primary font-mono">
                {(user.riskConfig.min_confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-1">Kelly Criterion</p>
              <Badge variant={user.riskConfig.use_kelly ? 'success' : 'neutral'}>
                {user.riskConfig.use_kelly ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Modals */}
      <SuspendUserModal
        isOpen={suspendModal}
        onClose={() => setSuspendModal(false)}
        userId={user._id}
        userEmail={user.email}
        onSuccess={handleModalSuccess}
      />

      <ReactivateUserModal
        isOpen={reactivateModal}
        onClose={() => setReactivateModal(false)}
        userId={user._id}
        userEmail={user.email}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
