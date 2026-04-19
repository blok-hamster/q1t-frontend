'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiException } from '@/types/api';
import { ROUTES } from '@/lib/constants';
import { Mail, Lock, Shield } from 'lucide-react';

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

      toast.success('Login successful!');
    } catch (error) {
      if (error instanceof ApiException) {
        // Handle 2FA required
        if (error.statusCode === 403 && error.details?.requires2FA) {
          setRequires2FA(true);
          toast('Please enter your 2FA code', {
            icon: 'ℹ️',
          });
          return;
        }

        // Handle account locked
        if (error.statusCode === 403 && error.error.includes('locked')) {
          setAccountLocked(error.error);
          toast.error(error.error);
          return;
        }

        // Handle invalid 2FA
        if (error.statusCode === 401 && error.details?.attemptsRemaining !== undefined) {
          setAttemptsRemaining(error.details.attemptsRemaining);
          setErrors({ ...errors, totpCode: 'Invalid 2FA code' });
          toast.error(`Invalid 2FA code. ${error.details.attemptsRemaining} attempts remaining.`);
          return;
        }

        // Generic error
        toast.error(error.error || 'Login failed');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Welcome Back"
        subtitle="Sign in to your account to continue"
      />

      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
            leftIcon={<Mail className="h-4 w-4" />}
            disabled={loading}
            required
            fullWidth
          />

          {/* Password */}
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
            leftIcon={<Lock className="h-4 w-4" />}
            disabled={loading}
            required
            fullWidth
          />

          {/* 2FA Code (conditional) */}
          {requires2FA && (
            <Input
              type="text"
              label="2FA Code"
              placeholder="000000"
              value={formData.totpCode}
              onChange={(e) =>
                setFormData({ ...formData, totpCode: e.target.value.replace(/\D/g, '').slice(0, 6) })
              }
              error={errors.totpCode}
              helperText={
                attemptsRemaining !== null
                  ? `${attemptsRemaining} attempts remaining`
                  : undefined
              }
              leftIcon={<Shield className="h-4 w-4" />}
              disabled={loading}
              required
              fullWidth
            />
          )}

          {/* Account locked message */}
          {accountLocked && (
            <div className="p-3 bg-negative/20 border border-negative/50 rounded-md">
              <p className="text-sm text-negative">{accountLocked}</p>
            </div>
          )}

          {/* Remember me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={formData.rememberMe}
              onChange={(e) =>
                setFormData({ ...formData, rememberMe: e.target.checked })
              }
              className="h-4 w-4 rounded border-border bg-bg-secondary text-accent-primary focus:ring-accent-primary"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 text-sm text-text-secondary"
            >
              Remember me
            </label>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            fullWidth
          >
            {requires2FA ? 'Verify & Login' : 'Login'}
          </Button>
        </form>
      </CardBody>

      <CardFooter>
        <div className="text-center text-sm text-text-secondary w-full">
          Don't have an account?{' '}
          <Link
            href={ROUTES.REGISTER}
            className="text-accent-primary hover:text-accent-hover font-medium"
          >
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
