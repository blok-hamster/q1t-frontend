'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { StatCard } from '@/components/admin/stat-card';
import { StatusBadge } from '@/components/admin/status-badge';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import { formatCurrency, formatTimeAgo } from '@/lib/utils/format';
import type { PlatformStats } from '@/types/admin';
import {
  Users,
  TrendingUp,
  BarChart3,
  Award,
  UserPlus,
  Send,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Failed to load statistics</p>
        <Button onClick={fetchStats} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Platform statistics and recent activity
          </p>
        </div>

        <div className="flex gap-3">
          <Link href={ROUTES.ADMIN_INVITES}>
            <Button variant="outlined" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Create Invite
            </Button>
          </Link>
          <Link href={ROUTES.ADMIN_USERS}>
            <Button variant="primary" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* User Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          User Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            subtitle="All registered users"
            icon={Users}
          />
          <StatCard
            title="Active Users"
            value={stats.users.active}
            subtitle={`${((stats.users.active / stats.users.total) * 100).toFixed(0)}% of total`}
            icon={TrendingUp}
          />
          <StatCard
            title="Suspended"
            value={stats.users.suspended}
            subtitle="Accounts suspended"
            icon={Users}
          />
          <StatCard
            title="With Wallets"
            value={stats.users.withWallets}
            subtitle="Users with private keys"
            icon={UserPlus}
          />
        </div>
      </div>

      {/* Trading Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Trading Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Trades"
            value={stats.trades.total}
            subtitle={`${stats.trades.filled} filled`}
            icon={BarChart3}
          />
          <StatCard
            title="Active Trades"
            value={stats.trades.pending}
            subtitle="Currently open"
            icon={TrendingUp}
          />
          <StatCard
            title="Total Volume"
            value={formatCurrency(Number(stats.trades.totalVolume), {
              maximumFractionDigits: 0,
            })}
            subtitle="Cumulative trading volume"
            icon={BarChart3}
          />
          <StatCard
            title="Total P&L"
            value={formatCurrency(Number(stats.trades.totalProfitLoss), {
              maximumFractionDigits: 2,
            })}
            subtitle="Platform profit/loss"
            icon={Award}
            trend={Number(stats.trades.totalProfitLoss) > 0 ? 'up' : 'down'}
          />
        </div>
      </div>

      {/* Prediction Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Prediction Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Predictions"
            value={stats.predictions.total}
            subtitle={`${stats.predictions.resolved} resolved`}
            icon={TrendingUp}
          />
          <StatCard
            title="Wins"
            value={stats.predictions.wins}
            subtitle="Correct predictions"
            icon={Award}
          />
          <StatCard
            title="Losses"
            value={stats.predictions.losses}
            subtitle="Incorrect predictions"
            icon={BarChart3}
          />
          <StatCard
            title="Win Rate"
            value={`${stats.predictions.winRate}%`}
            subtitle="Overall accuracy"
            icon={Award}
            trend={Number(stats.predictions.winRate) > 50 ? 'up' : 'down'}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader
            title="Recent Users"
            action={
              <Link
                href={ROUTES.ADMIN_USERS}
                className="text-sm text-accent-primary hover:text-accent-hover"
              >
                View All →
              </Link>
            }
          />
          <CardBody>
            {stats.recentActivity.users.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.users.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary font-mono">
                        {user.email}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {formatTimeAgo(user.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={user.accountStatus} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8 text-sm">
                No recent user registrations
              </p>
            )}
          </CardBody>
        </Card>

        {/* Recent Trades */}
        <Card>
          <CardHeader
            title="Recent Trades"
            action={
              <Link
                href={ROUTES.TRADES}
                className="text-sm text-accent-primary hover:text-accent-hover"
              >
                View All →
              </Link>
            }
          />
          <CardBody>
            {stats.recentActivity.trades.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.trades.map((trade) => (
                  <div
                    key={trade._id}
                    className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          trade.side === 'UP'
                            ? 'bg-positive/20'
                            : 'bg-negative/20'
                        }`}
                      >
                        {trade.side === 'UP' ? (
                          <ArrowUp className="h-4 w-4 text-positive" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-negative" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {formatCurrency(trade.size_usd)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {formatTimeAgo(trade.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary">
                      {trade.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8 text-sm">
                No recent trades
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
