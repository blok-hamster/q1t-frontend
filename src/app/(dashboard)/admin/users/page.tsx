'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { StatusBadge } from '@/components/admin/status-badge';
import { SuspendUserModal } from '@/components/admin/suspend-user-modal';
import { ReactivateUserModal } from '@/components/admin/reactivate-user-modal';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/context/toast-context';
import { formatTimeAgo } from '@/lib/utils/format';
import type { AdminUser } from '@/types/admin';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Ban,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

type FilterStatus = 'all' | 'active' | 'suspended' | 'pending';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });

  // Suspend/Reactivate modals
  const [suspendModal, setSuspendModal] = useState<{
    open: boolean;
    userId: string;
    userEmail: string;
  }>({ open: false, userId: '', userEmail: '' });

  const [reactivateModal, setReactivateModal] = useState<{
    open: boolean;
    userId: string;
    userEmail: string;
  }>({ open: false, userId: '', userEmail: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers({
        page,
        limit: 50,
        status: filterStatus,
        search: search || undefined,
      });
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setPage(1); // Reset to first page
    fetchUsers();
  };

  const handleSuspendClick = (userId: string, userEmail: string) => {
    setSuspendModal({ open: true, userId, userEmail });
  };

  const handleReactivateClick = (userId: string, userEmail: string) => {
    setReactivateModal({ open: true, userId, userEmail });
  };

  const handleModalSuccess = () => {
    fetchUsers(); // Refresh list
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">User Management</h1>
        <p className="text-sm text-text-secondary mt-1">
          View and manage all user accounts
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                leftIcon={<Search className="h-4 w-4" />}
                fullWidth
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'suspended', 'pending'] as FilterStatus[]).map(
                (status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'primary' : 'outlined'}
                    size="sm"
                    onClick={() => {
                      setFilterStatus(status);
                      setPage(1);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                )
              )}
            </div>

            {/* Search Button */}
            <Button onClick={handleSearch} variant="primary" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader
          title={`Users (${pagination.total})`}
          subtitle={`Page ${pagination.page} of ${pagination.pages}`}
        />
        <CardBody>
          {loading ? (
            <Loading />
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Email & Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-text-primary font-mono truncate">
                          {user.email}
                        </p>
                        {user.isAdmin && (
                          <Badge variant="info" size="sm">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-tertiary">
                        <span>
                          Joined {formatTimeAgo(user.createdAt)}
                        </span>
                        {user.wallet_address && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Wallet Connected
                          </span>
                        )}
                        {user.twoFactorEnabled && (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            2FA Enabled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <StatusBadge status={user.accountStatus} />

                    {/* Trading Status */}
                    <div className="text-center">
                      <p className="text-xs text-text-tertiary mb-1">Trading</p>
                      <Badge
                        variant={user.isActive ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/admin/users/${user._id}`}>
                      <Button variant="outlined" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>

                    {!user.isAdmin && (
                      <>
                        {user.accountStatus === 'active' ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleSuspendClick(user._id, user.email)
                            }
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend
                          </Button>
                        ) : user.accountStatus === 'suspended' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleReactivateClick(user._id, user.email)
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Reactivate
                          </Button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary">No users found</p>
              {search && (
                <Button onClick={() => setSearch('')} className="mt-4">
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </CardBody>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-text-secondary">
              Showing {(page - 1) * pagination.limit + 1} to{' '}
              {Math.min(page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} users
            </p>

            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <SuspendUserModal
        isOpen={suspendModal.open}
        onClose={() => setSuspendModal({ open: false, userId: '', userEmail: '' })}
        userId={suspendModal.userId}
        userEmail={suspendModal.userEmail}
        onSuccess={handleModalSuccess}
      />

      <ReactivateUserModal
        isOpen={reactivateModal.open}
        onClose={() =>
          setReactivateModal({ open: false, userId: '', userEmail: '' })
        }
        userId={reactivateModal.userId}
        userEmail={reactivateModal.userEmail}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
