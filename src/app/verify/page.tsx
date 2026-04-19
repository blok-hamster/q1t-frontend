'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi, tokenUtils } from '@/lib/api';
import { ROUTES } from '@/lib/constants';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'verifying' | 'onboarding' | 'completing' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const urlToken = searchParams.get('token');

      if (!urlToken) {
        setStep('error');
        setErrorMessage('No verification token provided');
        return;
      }

      setToken(urlToken);

      try {
        // Step 1: Verify the token is valid
        const response = await authApi.verifyMagicLink(urlToken);

        if (response.userExists) {
          // User already has an account, they should use login page
          setStep('error');
          setErrorMessage('This email already has an account. Please use the login page.');
        } else {
          // New user - show onboarding form
          setEmail(response.email);
          setStep('onboarding');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStep('error');

        if (error.response?.data?.error) {
          setErrorMessage(error.response.data.error);
        } else {
          setErrorMessage('Invalid or expired verification link');
        }
      }
    };

    verifyToken();
  }, [searchParams]);

  const completeRegistration = async (urlToken: string, userPassword: string) => {
    try {
      setStep('completing');

      // Step 2: Complete registration with password
      const response = await authApi.completeMagicLinkRegistration(urlToken, userPassword);

      // Save the session token
      tokenUtils.set(response.token);

      setStep('success');

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push(ROUTES.DASHBOARD);
      }, 1500);
    } catch (error: any) {
      console.error('Registration error:', error);
      setStep('error');

      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Failed to complete registration');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Validate password
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    await completeRegistration(token, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary rounded-lg p-8 shadow-lg border border-white/10">
          {step === 'verifying' && (
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent"></div>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary mb-2">
                Verifying Your Invitation
              </h1>
              <p className="text-text-secondary">
                Please wait while we verify your access...
              </p>
            </div>
          )}

          {step === 'onboarding' && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-text-primary mb-2">
                  Welcome to q1t!
                </h1>
                <p className="text-text-secondary">
                  Create your password to complete registration
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2 bg-bg-tertiary border border-white/10 rounded-md text-text-primary opacity-60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 bg-bg-tertiary border border-white/10 rounded-md text-text-primary focus:border-accent-primary focus:outline-none"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    At least 8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-2 bg-bg-tertiary border border-white/10 rounded-md text-text-primary focus:border-accent-primary focus:outline-none"
                    required
                  />
                </div>

                {passwordError && (
                  <p className="text-sm text-negative">
                    {passwordError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-accent-primary hover:bg-accent-hover text-white font-medium rounded-md transition-colors"
                >
                  Create Account
                </button>
              </form>

              <div className="mt-6 p-4 bg-bg-tertiary rounded-md border border-white/5">
                <p className="text-sm text-text-tertiary">
                  💡 <span className="font-medium text-text-secondary">Optional:</span> You can set up 2FA after logging in for added security.
                </p>
              </div>
            </div>
          )}

          {step === 'completing' && (
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent"></div>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary mb-2">
                Creating Your Account
              </h1>
              <p className="text-text-secondary">
                Please wait...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="inline-block h-12 w-12 text-positive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary mb-2">
                Account Created!
              </h1>
              <p className="text-text-secondary">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="inline-block h-12 w-12 text-negative"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary mb-2">
                Verification Failed
              </h1>
              <p className="text-negative mb-4">
                {errorMessage}
              </p>
              <button
                onClick={() => router.push(ROUTES.LOGIN)}
                className="px-6 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-md transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
