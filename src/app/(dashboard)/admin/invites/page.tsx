'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/context/toast-context';
import type { InviteResponse } from '@/types/admin';
import { Send, Copy, CheckCircle, Info, Clock, Mail } from 'lucide-react';

export default function InviteManagementPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState<InviteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.createInvite(email);
      setInviteData(response);
      toast.success(`Invite link created for ${email}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteData) return;

    try {
      await navigator.clipboard.writeText(inviteData.magicLink);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleReset = () => {
    setEmail('');
    setInviteData(null);
    setCopied(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary">Invite Management</h1>
        <p className="text-sm text-text-secondary mt-1">
          Create magic links to invite new users to the platform
        </p>
      </div>

      {/* Info Card */}
      <Card variant="glass">
        <CardBody>
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-accent-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <p className="font-medium text-text-primary mb-1">
                How Invite Links Work
              </p>
              <ul className="space-y-1 text-xs">
                <li>• Magic links are valid for 15 minutes</li>
                <li>• User clicks link and is auto-registered</li>
                <li>• Account is immediately activated</li>
                <li>• User can complete onboarding (password, 2FA, wallet)</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      {!inviteData ? (
        /* Create Invite Form */
        <Card>
          <CardHeader
            title="Create Invitation"
            subtitle="Enter the email address of the person you want to invite"
          />
          <CardBody>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <Input
                type="email"
                label="Email Address"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                helperText="The email address for the new user"
                disabled={loading}
                required
                fullWidth
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                fullWidth
                size="lg"
              >
                <Send className="h-5 w-5 mr-2" />
                Generate Invite Link
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : (
        /* Invite Link Display */
        <div className="space-y-4">
          <Card variant="elevated">
            <CardHeader
              title="Invite Link Created!"
              subtitle={`Magic link for ${inviteData.email}`}
            />
            <CardBody className="space-y-4">
              {/* Success Message */}
              <div className="p-4 bg-positive/10 border border-positive/30 rounded-lg">
                <div className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-positive flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-positive mb-1">
                      Invitation Created Successfully
                    </p>
                    <p className="text-text-secondary text-xs">
                      Share this link with <span className="font-mono font-medium">{inviteData.email}</span> to
                      grant them access to the platform.
                    </p>
                  </div>
                </div>
              </div>

              {/* Expiration Warning */}
              <div className="p-3 bg-neutral/10 border border-neutral/30 rounded-lg">
                <div className="flex gap-2 items-center">
                  <Clock className="h-4 w-4 text-neutral" />
                  <p className="text-xs text-text-secondary">
                    This link expires in <span className="font-semibold text-neutral">{inviteData.expiresIn}</span>.
                    Make sure to share it promptly.
                  </p>
                </div>
              </div>

              {/* Magic Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Magic Link
                </label>
                <div className="relative">
                  <div className="p-4 bg-bg-tertiary border border-border rounded-lg font-mono text-xs text-text-primary break-all">
                    {inviteData.magicLink}
                  </div>
                  <Button
                    variant={copied ? 'primary' : 'outlined'}
                    size="sm"
                    onClick={handleCopyLink}
                    className="absolute top-2 right-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-accent-muted border border-accent-primary/30 rounded-lg">
                <p className="text-sm font-medium text-accent-primary mb-2">
                  Next Steps
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-text-secondary">
                  <li>Copy the magic link above</li>
                  <li>Share it with {inviteData.email} via email or message</li>
                  <li>User clicks link and is automatically registered</li>
                  <li>User completes onboarding (password, 2FA, wallet)</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="primary" onClick={handleCopyLink} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button variant="outlined" onClick={handleReset} className="flex-1">
                  Create Another
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Security Note */}
          <Card>
            <CardBody>
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-text-tertiary flex-shrink-0 mt-0.5" />
                <div className="text-xs text-text-secondary">
                  <p className="font-medium text-text-primary mb-1">
                    Security Note
                  </p>
                  <p>
                    This link can only be used once and expires after 15 minutes. If the link
                    expires or the user encounters issues, you can generate a new one.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
