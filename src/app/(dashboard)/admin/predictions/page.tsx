'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { PredictionRecord } from '@/types/admin';
import {
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Download,
} from 'lucide-react';

type FilterOutcome = 'all' | 'WIN' | 'LOSS' | 'PENDING';

export default function PredictionsMonitorPage() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterOutcome, setFilterOutcome] = useState<FilterOutcome>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPredictions({
        page,
        limit: 50,
        outcome: filterOutcome,
      });
      setPredictions(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [page, filterOutcome]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'WIN':
        return <Badge variant="success">Win</Badge>;
      case 'LOSS':
        return <Badge variant="error">Loss</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="neutral">{outcome}</Badge>;
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await adminApi.exportPredictions();
      toast.success('Predictions exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export predictions');
    } finally {
      setExporting(false);
    }
  };

  const winCount = predictions.filter((p) => p.outcome === 'WIN').length;
  const lossCount = predictions.filter((p) => p.outcome === 'LOSS').length;
  const winRate =
    winCount + lossCount > 0
      ? ((winCount / (winCount + lossCount)) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Predictions Monitor
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            View all AI predictions and outcomes
          </p>
        </div>

        {/* Stats & Export */}
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-center">
            <div className="px-4 py-2 bg-bg-tertiary rounded-lg">
              <p className="text-xs text-text-tertiary mb-1">Win Rate</p>
              <p className="text-lg font-bold font-mono text-positive">{winRate}%</p>
            </div>
            <div className="px-4 py-2 bg-bg-tertiary rounded-lg">
              <p className="text-xs text-text-tertiary mb-1">Total</p>
              <p className="text-lg font-bold font-mono text-text-primary">
                {pagination.total}
              </p>
            </div>
          </div>
          <Button
            variant="outlined"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex gap-2">
            {(['all', 'WIN', 'LOSS', 'PENDING'] as FilterOutcome[]).map((outcome) => (
              <Button
                key={outcome}
                variant={filterOutcome === outcome ? 'primary' : 'outlined'}
                size="sm"
                onClick={() => {
                  setFilterOutcome(outcome);
                  setPage(1);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                {outcome === 'all' ? 'All' : outcome}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Predictions List */}
      <Card>
        <CardHeader
          title={`Predictions (${pagination.total})`}
          subtitle={`Page ${pagination.page} of ${pagination.pages}`}
        />
        <CardBody>
          {loading ? (
            <Loading />
          ) : predictions.length > 0 ? (
            <div className="space-y-3">
              {predictions.map((prediction) => {
                const isUp = prediction.direction === 'UP';
                const DirectionIcon = isUp ? TrendingUp : TrendingDown;

                return (
                  <div
                    key={prediction._id}
                    className="p-4 bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      {/* Direction & Confidence */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isUp ? 'bg-positive/20' : 'bg-negative/20'
                          }`}
                        >
                          <DirectionIcon
                            className={`h-5 w-5 ${
                              isUp ? 'text-positive' : 'text-negative'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {prediction.direction}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {(prediction.confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                      </div>

                      {/* Outcome Badge */}
                      {getOutcomeBadge(prediction.outcome)}
                    </div>

                    {/* Price Info */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">Strike Price</p>
                        <p className="text-sm font-mono font-semibold text-text-primary">
                          {formatCurrency(prediction.strike_price, {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">
                          Target Close
                        </p>
                        <p className="text-sm font-mono font-semibold text-text-primary">
                          {formatCurrency(prediction.target_close, {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">
                          Actual Close
                        </p>
                        <p className="text-sm font-mono font-semibold text-text-primary">
                          {prediction.actual_close
                            ? formatCurrency(prediction.actual_close, {
                                maximumFractionDigits: 2,
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Market & Timestamp */}
                    <div className="flex items-center justify-between text-xs text-text-tertiary pt-3 border-t border-border">
                      <span className="font-mono">{prediction.market_slug}</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(prediction.createdAt)}
                        </span>
                        {prediction.resolved_at && (
                          <span>Resolved: {formatDate(prediction.resolved_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">No predictions found</p>
            </div>
          )}
        </CardBody>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-text-secondary">
              Showing {(page - 1) * pagination.limit + 1} to{' '}
              {Math.min(page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} predictions
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
    </div>
  );
}
