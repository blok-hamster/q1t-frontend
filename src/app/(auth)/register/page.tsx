'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/context/toast-context';
import { Input } from '@/components/ui/input';
import { ApiException } from '@/types/api';
import { ROUTES } from '@/lib/constants';
import {
  getPasswordStrength,
  checkPasswordRequirements,
} from '@/lib/utils/validation';
import { Mail, Lock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function RegisterPage() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: '',
  });

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordReqs = checkPasswordRequirements(formData.password);

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: '',
    };

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!passwordReqs.hasUppercase) {
      newErrors.password = 'Password must contain an uppercase letter';
    } else if (!passwordReqs.hasLowercase) {
      newErrors.password = 'Password must contain a lowercase letter';
    } else if (!passwordReqs.hasNumber) {
      newErrors.password = 'Password must contain a number';
    } else if (!passwordReqs.hasSpecialChar) {
      newErrors.password = 'Password must contain a special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Must accept system terms';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('FIX FORM ERRORS');
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password);
      toast.success('ACCOUNT CREATED SUCCESSFULLY');
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 409) {
          setErrors({ ...errors, email: 'EMAIL ALREADY EXISTS' });
          toast.error('EMAIL ALREADY REGISTERED');
        } else {
          toast.error(error.error || 'REGISTRATION FAILED');
        }
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
          CREATE OPERATOR ACCOUNT
        </h2>
        <p className="text-[11px] text-[#586069] mt-0.5 uppercase">
          Initialize access to automated signal execution
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

        <div className="space-y-2">
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

          {formData.password && (
            <div className="space-y-1.5 p-2 bg-[#16191E] border border-[#1B2026]">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#080A0C] overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      passwordStrength.label === 'weak' && 'w-1/4 bg-[#E55353]',
                      passwordStrength.label === 'fair' && 'w-2/4 bg-[#D99B00]',
                      passwordStrength.label === 'good' && 'w-3/4 bg-[#20B2AA]',
                      passwordStrength.label === 'strong' && 'w-full bg-[#20B2AA]'
                    )}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase text-[#8B949E]">
                  {passwordStrength.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 pt-1">
                <RequirementItem met={passwordReqs.minLength} text="8+ CHARS" />
                <RequirementItem met={passwordReqs.hasUppercase} text="1 UPPER" />
                <RequirementItem met={passwordReqs.hasLowercase} text="1 LOWER" />
                <RequirementItem met={passwordReqs.hasNumber} text="1 NUMBER" />
              </div>
            </div>
          )}
        </div>

        <Input
          type="password"
          label="CONFIRM PASSWORD"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
          leftIcon={<Lock className="h-3.5 w-3.5 text-[#586069]" />}
          disabled={loading}
          required
          fullWidth
        />

        <div className="space-y-1">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="h-3.5 w-3.5 bg-[#16191E] border-[#1B2026] text-[#20B2AA] focus:ring-[#20B2AA]"
            />
            <label htmlFor="acceptTerms" className="ml-2 text-xs text-[#8B949E]">
              ACCEPT TERMS & SYSTEM POLICIES
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-[10px] text-[#E55353]">{errors.acceptTerms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 font-mono text-xs font-bold uppercase text-[#080A0C] bg-[#20B2AA] hover:bg-[#1CA099] transition-colors rounded-xs flex items-center justify-center gap-2"
        >
          {loading ? 'REGISTERING...' : 'CREATE OPERATOR ACCOUNT'}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="pt-3 border-t border-[#1B2026] text-center text-xs text-[#8B949E]">
        ALREADY REGISTERED?{' '}
        <Link href={ROUTES.LOGIN} className="text-[#20B2AA] hover:underline font-bold">
          LOG IN
        </Link>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1 text-[10px]">
      {met ? (
        <CheckCircle2 className="h-3 w-3 text-[#20B2AA]" />
      ) : (
        <XCircle className="h-3 w-3 text-[#586069]" />
      )}
      <span className={met ? 'text-[#E1E4E8]' : 'text-[#586069]'}>
        {text}
      </span>
    </div>
  );
}
