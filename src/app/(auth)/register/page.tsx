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
import {
  getPasswordStrength,
  checkPasswordRequirements,
} from '@/lib/utils/validation';
import { Mail, Lock, CheckCircle2, XCircle } from 'lucide-react';
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

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Password validation
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

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password);
      toast.success('Account created successfully!');
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.statusCode === 409) {
          setErrors({ ...errors, email: 'Email already exists' });
          toast.error('Email already exists');
        } else {
          toast.error(error.error || 'Registration failed');
        }
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
        title="Create Account"
        subtitle="Start trading with AI-powered signals"
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
          <div className="space-y-2">
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

            {/* Password strength indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        passwordStrength.label === 'weak' && 'w-1/4 bg-negative',
                        passwordStrength.label === 'fair' && 'w-2/4 bg-neutral',
                        passwordStrength.label === 'good' && 'w-3/4 bg-accent-primary',
                        passwordStrength.label === 'strong' && 'w-full bg-positive'
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium capitalize',
                      passwordStrength.color
                    )}
                  >
                    {passwordStrength.label}
                  </span>
                </div>

                {/* Password requirements checklist */}
                <div className="space-y-1">
                  <RequirementItem
                    met={passwordReqs.minLength}
                    text="At least 8 characters"
                  />
                  <RequirementItem
                    met={passwordReqs.hasUppercase}
                    text="One uppercase letter"
                  />
                  <RequirementItem
                    met={passwordReqs.hasLowercase}
                    text="One lowercase letter"
                  />
                  <RequirementItem
                    met={passwordReqs.hasNumber}
                    text="One number"
                  />
                  <RequirementItem
                    met={passwordReqs.hasSpecialChar}
                    text="One special character"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <Input
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            error={errors.confirmPassword}
            success={
              formData.confirmPassword &&
              formData.password === formData.confirmPassword
                ? 'Passwords match'
                : undefined
            }
            leftIcon={<Lock className="h-4 w-4" />}
            disabled={loading}
            required
            fullWidth
          />

          {/* Terms & Conditions */}
          <div className="space-y-1">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) =>
                  setFormData({ ...formData, acceptTerms: e.target.checked })
                }
                className="h-4 w-4 mt-0.5 rounded border-border bg-bg-secondary text-accent-primary focus:ring-accent-primary"
              />
              <label
                htmlFor="acceptTerms"
                className="ml-2 text-sm text-text-secondary"
              >
                I accept the{' '}
                <Link
                  href="#"
                  className="text-accent-primary hover:text-accent-hover"
                >
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link
                  href="#"
                  className="text-accent-primary hover:text-accent-hover"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs text-negative ml-6">{errors.acceptTerms}</p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            fullWidth
          >
            Create Account
          </Button>
        </form>
      </CardBody>

      <CardFooter>
        <div className="text-center text-sm text-text-secondary w-full">
          Already have an account?{' '}
          <Link
            href={ROUTES.LOGIN}
            className="text-accent-primary hover:text-accent-hover font-medium"
          >
            Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckCircle2 className="h-3 w-3 text-positive" />
      ) : (
        <XCircle className="h-3 w-3 text-text-tertiary" />
      )}
      <span className={met ? 'text-text-primary' : 'text-text-tertiary'}>
        {text}
      </span>
    </div>
  );
}
