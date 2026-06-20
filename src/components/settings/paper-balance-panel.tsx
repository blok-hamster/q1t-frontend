'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { Wallet } from 'lucide-react';
import { useSocket } from '@/context/socket-context';
import { useEffect } from 'react';

interface PaperBalancePanelProps {
  initialBalance: number;
  onUpdate: (balance: number) => void;
}

export function PaperBalancePanel({ initialBalance, onUpdate }: PaperBalancePanelProps) {
  const { socket } = useSocket();
  const [balance, setBalance] = useState(initialBalance);
  const [inputValue, setInputValue] = useState(String(initialBalance));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: { balance: number }) => {
      setBalance(data.balance);
      onUpdate(data.balance);
    };
    socket.on('paper_balance_update', handler);
    return () => { socket.off('paper_balance_update', handler); };
  }, [socket, onUpdate]);

  const handleSave = async () => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || value < 0) {
      toast.error('Balance must be a non-negative number');
      return;
    }
    setSaving(true);
    try {
      const result = await settingsApi.updatePaperBalance(value);
      setBalance(result.paperBalance);
      onUpdate(result.paperBalance);
      toast.success(`Paper balance set to $${result.paperBalance.toFixed(2)}`);
    } catch {
      toast.error('Failed to update paper balance');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const result = await settingsApi.resetPaperBalance(1000);
      setBalance(result.paperBalance);
      setInputValue(String(result.paperBalance));
      onUpdate(result.paperBalance);
      toast.success('Paper balance reset to $1,000.00');
    } catch {
      toast.error('Failed to reset paper balance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-accent-primary" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Paper Trading Balance</h3>
            <p className="text-sm text-text-secondary mt-1">
              Simulated bankroll for dry-run mode. Deducted on entry, credited on exit.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Current Balance</p>
            <p className={`text-2xl font-mono font-bold tabular-nums ${balance >= 0 ? 'text-positive' : 'text-negative'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-28 px-3 py-2 text-sm font-mono bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              min="0"
              step="100"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
            >
              Set
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary disabled:opacity-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
