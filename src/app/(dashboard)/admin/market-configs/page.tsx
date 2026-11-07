'use client';

import { useState, useCallback, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/context/toast-context';
import { RefreshCw, Save, FileText, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const COMPACT_FIELDS = [
  'market_type', 'enabled',
  'num_shares', 'entry_share_price', 'max_entry_price',
  'fair_value_enabled', 'min_fair_value_edge', 'fair_value_sigma',
  'fair_value_stop_prob', 'fair_value_stop_bid', 'stop_loss_debounce_ticks',
  'watch_start_seconds', 'watch_end_seconds',
  'streak_enabled', 'breaker_enabled',
  'auto_scale_enabled', 'auto_scale_min_shares', 'auto_scale_target_shares',
  'auto_scale_lookback_hours', 'auto_scale_promote_hours', 'auto_scale_promote_min_trades',
  'auto_scale_flip_hold_minutes', 'auto_scale_eval_seconds',
];

function stripSystemFields(config: any): any {
  const { _id, __v, createdAt, updated_at, updated_by, ...rest } = config;
  return rest;
}

export default function AdminMarketConfigsPage() {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [results, setResults] = useState<{ market_type: string; mode: string; fields: number }[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getMarketConfigs();
      const configs = (data.configs || []).map(stripSystemFields);
      setJsonText(JSON.stringify(configs, null, 2));
      setParseError(null);
      toast.success(`Loaded ${configs.length} market configs`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load market configs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleApply = async () => {
    setParseError(null);
    let configs: any[];
    try {
      configs = JSON.parse(jsonText);
    } catch (e: any) {
      setParseError(e.message || 'Invalid JSON');
      toast.error('Invalid JSON — fix the error before applying');
      return;
    }
    if (!Array.isArray(configs)) {
      setParseError('JSON must be an array of market configs');
      toast.error('JSON must be an array');
      return;
    }
    if (configs.length === 0) {
      setParseError('Config array is empty');
      toast.error('Config array is empty');
      return;
    }

    setApplying(true);
    setResults(null);
    try {
      const res = await adminApi.bulkApplyMarketConfigs(configs);
      setResults(res.results);
      toast.success(res.message);
      // Refresh from DB so the editor reflects the truth-after-apply
      const data = await adminApi.getMarketConfigs();
      setJsonText(JSON.stringify((data.configs || []).map(stripSystemFields), null, 2));
    } catch (error: any) {
      toast.error(error.message || 'Bulk apply failed');
    } finally {
      setApplying(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-market-configs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(String(reader.result));
      setParseError(null);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const modeColor = (mode: string) => {
    switch (mode) {
      case 'created': return 'text-positive';
      case 'updated': return 'text-accent-primary';
      case 'unchanged': return 'text-text-tertiary';
      default: return 'text-negative';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Market Configs</h1>
          <p className="text-sm text-text-secondary mt-1">
            Global strategy settings (all markets). Edit the JSON below, then Apply All.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outlined" size="sm" onClick={loadConfigs} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button variant="outlined" size="sm" onClick={handleDownload} disabled={!jsonText}>
            <FileText className="h-4 w-4 mr-2" />
            Download JSON
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept=".json,application/json" className="hidden" onChange={handleFileLoad} />
            <span className="inline-flex items-center text-sm px-3 py-1.5 border border-border rounded-md text-text-secondary hover:text-text-primary transition-colors">
              <FileText className="h-4 w-4 mr-2" />
              Load File
            </span>
          </label>
          <Button variant="primary" size="sm" onClick={handleApply} disabled={applying}>
            <Save className="h-4 w-4 mr-2" />
            {applying ? 'Applying…' : 'Apply All'}
          </Button>
        </div>
      </div>

      {/* Per-market quick summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(() => {
          try {
            const arr = JSON.parse(jsonText);
            return Array.isArray(arr) ? arr.map((c) => (
              <div key={c?.market_type} className="bg-bg-tertiary border border-border rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-text-primary truncate">{c?.market_type}</span>
                  <span className={`text-[10px] uppercase ${c?.enabled ? 'text-positive' : 'text-negative'}`}>
                    {c?.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {typeof c?.min_fair_value_edge === 'number' && (
                    <span className="inline-block text-[9px] font-bold uppercase text-positive bg-positive/10 border border-positive/30 px-1 py-0.5 rounded-xs">
                      FV +{(c.min_fair_value_edge * 100).toFixed(1)}¢
                    </span>
                  )}
                  {typeof c?.entry_share_price === 'number' && typeof c?.max_entry_price === 'number' && (
                    <span className="inline-block text-[9px] font-bold uppercase text-text-secondary bg-bg-secondary border border-border px-1 py-0.5 rounded-xs">
                      ${c.entry_share_price.toFixed(2)}–${c.max_entry_price.toFixed(2)}
                    </span>
                  )}
                  {typeof c?.num_shares === 'number' && (
                    <span className="inline-block text-[9px] font-bold uppercase text-text-secondary bg-bg-secondary border border-border px-1 py-0.5 rounded-xs">
                      {c.num_shares} sh
                    </span>
                  )}
                  {c?.auto_scale_enabled && (
                    <span className="inline-block text-[9px] font-bold uppercase text-accent-primary bg-accent-muted border border-accent-primary/30 px-1 py-0.5 rounded-xs">
                      auto-scale
                    </span>
                  )}
                </div>
              </div>
            )) : null;
          } catch {
            return null;
          }
        })()}
      </div>

      {/* JSON editor */}
      <Card>
        <CardHeader
          title="Configuration JSON"
          action={
            <span className="text-xs text-text-tertiary flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              system fields (updated_by, updated_at) are stripped
            </span>
          }
        />
        <CardBody>
          <textarea
            className="w-full h-[60vh] font-mono text-xs bg-[#0A0C0E] border border-border rounded-lg p-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
          {parseError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-negative">
              <XCircle className="h-4 w-4" />
              {parseError}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Apply results */}
      {results && (
        <Card>
          <CardHeader title="Last Apply Result" />
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-bg-tertiary border border-border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-positive">{results.filter(r => r.mode === 'created').length}</p>
                <p className="text-xs text-text-secondary uppercase">Created</p>
              </div>
              <div className="bg-bg-tertiary border border-border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-accent-primary">{results.filter(r => r.mode === 'updated').length}</p>
                <p className="text-xs text-text-secondary uppercase">Updated</p>
              </div>
              <div className="bg-bg-tertiary border border-border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-text-primary">{results.filter(r => r.mode === 'unchanged').length}</p>
                <p className="text-xs text-text-secondary uppercase">Unchanged</p>
              </div>
              <div className="bg-bg-tertiary border border-border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-negative">{results.filter(r => r.mode === 'skipped').length}</p>
                <p className="text-xs text-text-secondary uppercase">Skipped</p>
              </div>
            </div>
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.market_type} className="flex items-center justify-between p-2 bg-bg-tertiary border border-border rounded-md">
                  <span className="text-sm font-mono text-text-primary">{r.market_type}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-tertiary">{r.fields} fields</span>
                    <span className={`flex items-center gap-1 text-xs font-bold uppercase ${modeColor(r.mode)}`}>
                      {r.mode === 'created' && <CheckCircle className="h-3.5 w-3.5" />}
                      {r.mode === 'updated' && <AlertTriangle className="h-3.5 w-3.5" />}
                      {r.mode === 'unchanged' && <CheckCircle className="h-3.5 w-3.5" />}
                      {r.mode === 'skipped' && <XCircle className="h-3.5 w-3.5" />}
                      {r.mode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}