'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/context/toast-context';
import { Input } from '@/components/ui/input';
import { ApiException } from '@/types/api';
import { ROUTES } from '@/lib/constants';
import { Mail, Lock, Shield, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [accountLocked, setAccountLocked] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    totpCode: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    totpCode: '',
  });

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      totpCode: '',
    };

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (requires2FA && !formData.totpCode) {
      newErrors.totpCode = '2FA code is required';
    } else if (requires2FA && !/^\d{6}$/.test(formData.totpCode)) {
      newErrors.totpCode = '2FA code must be 6 digits';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setAccountLocked(null);
    setAttemptsRemaining(null);

    try {
      await login(
        formData.email,
        formData.password,
        requires2FA ? formData.totpCode : undefined
      );

      toast.success('AUTHENTICATION SUCCESSFUL');
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 403 && error.details?.requires2FA) {
          setRequires2FA(true);
          toast('ENTER 2FA SECURITY CODE', { icon: 'ℹ️' });
          return;
        }

        if (error.statusCode === 403 && error.error.includes('locked')) {
          setAccountLocked(error.error);
          toast.error(error.error);
          return;
        }

        if (error.statusCode === 401 && error.details?.attemptsRemaining !== undefined) {
          setAttemptsRemaining(error.details.attemptsRemaining);
          setErrors({ ...errors, totpCode: 'INVALID 2FA CODE' });
          toast.error(`INVALID CODE. ${error.details.attemptsRemaining} ATTEMPTS REMAINING.`);
          return;
        }

        toast.error(error.error || 'LOGIN FAILED');
      } else {
        toast.error('UNEXPECTED SYSTEM ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="pb-3 border-b border-[#1B2026]">
        <h2 className="text-sm font-mono font-bold text-[#E1E4E8] uppercase tracking-wide">
          AUTHENTICATE SESSION
        </h2>
        <p className="text-[11px] text-[#586069] mt-0.5 uppercase">
          Enter credentials to access live signal treasury
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          label="EMAIL ADDRESS"
          placeholder="operator@domain.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          leftIcon={<Mail className="h-3.5 w-3.5 text-[#586069]" />}
          disabled={loading}
          required
          fullWidth
        />

        <Input
          type="password"
          label="PASSWORD"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          leftIcon={<Lock className="h-3.5 w-3.5 text-[#586069]" />}
          disabled={loading}
          required
          fullWidth
        />

        {requires2FA && (
          <Input
            type="text"
            label="2FA SECURITY CODE"
            placeholder="000000"
            value={formData.totpCode}
            onChange={(e) =>
              setFormData({ ...formData, totpCode: e.target.value.replace(/\D/g, '').slice(0, 6) })
            }
            error={errors.totpCode}
            helperText={
              attemptsRemaining !== null
                ? `${attemptsRemaining} ATTEMPTS REMAINING`
                : undefined
            }
            leftIcon={<Shield className="h-3.5 w-3.5 text-[#586069]" />}
            disabled={loading}
            required
            fullWidth
          />
        )}

        {accountLocked && (
          <div className="p-2 bg-[#E55353]/10 border border-[#E55353]/30 rounded-xs">
            <p className="text-xs text-[#E55353]">{accountLocked}</p>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
            className="h-3.5 w-3.5 bg-[#16191E] border-[#1B2026] text-[#20B2AA] focus:ring-[#20B2AA]"
          />
          <label htmlFor="rememberMe" className="ml-2 text-xs text-[#8B949E]">
            REMEMBER SESSION
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 font-mono text-xs font-bold uppercase text-[#080A0C] bg-[#20B2AA] hover:bg-[#1CA099] transition-colors rounded-xs flex items-center justify-center gap-2"
        >
          {loading ? 'AUTHENTICATING...' : requires2FA ? 'VERIFY 2FA & ENTER' : 'SIGN IN TO TERMINAL'}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="pt-3 border-t border-[#1B2026] text-center text-xs text-[#8B949E]">
        NO ACCOUNT?{' '}
        <Link href={ROUTES.REGISTER} className="text-[#20B2AA] hover:underline font-bold">
          REGISTER OPERATOR
        </Link>
      </div>
    </div>
  );
}
