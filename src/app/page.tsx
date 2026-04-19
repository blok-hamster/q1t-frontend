'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ROUTES, APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import {
  TrendingUp,
  Shield,
  Zap,
  Bot,
  BarChart3,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-secondary/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image
                  src="/logo.svg"
                  alt="q1t Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-text-primary">AI-Powered</span>
            <br />
            <span className="gradient-text">Bitcoin Trading</span>
          </h1>

          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Trade Bitcoin with confidence using our advanced AI prediction
            engine. Real-time signals, automated execution, and proven risk
            management.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href={ROUTES.REGISTER}>
              <Button size="lg" variant="primary">
                Start Trading
              </Button>
            </Link>
            <Link href={ROUTES.LOGIN}>
              <Button size="lg" variant="outlined">
                View Dashboard
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-4xl font-bold text-accent-primary font-mono">
                72%
              </p>
              <p className="text-sm text-text-secondary mt-2">
                AI Accuracy Rate
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-accent-primary font-mono">
                $2.5M+
              </p>
              <p className="text-sm text-text-secondary mt-2">
                Trading Volume
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-accent-primary font-mono">
                1,000+
              </p>
              <p className="text-sm text-text-secondary mt-2">
                Active Traders
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose {APP_NAME}?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card padding="lg" hover>
              <Bot className="h-12 w-12 text-accent-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Trading Signals</h3>
              <p className="text-text-secondary">
                Advanced machine learning models analyze market data to generate
                high-probability trading signals every 5 minutes.
              </p>
            </Card>

            <Card padding="lg" hover>
              <Shield className="h-12 w-12 text-positive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Risk Management</h3>
              <p className="text-text-secondary">
                Customizable risk parameters with Kelly Criterion optimization
                to protect your capital and maximize returns.
              </p>
            </Card>

            <Card padding="lg" hover>
              <Zap className="h-12 w-12 text-neutral mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Execution</h3>
              <p className="text-text-secondary">
                Automated trade execution on Polymarket with minimal slippage
                and instant confirmations.
              </p>
            </Card>

            <Card padding="lg" hover>
              <BarChart3 className="h-12 w-12 text-accent-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Live Dashboard</h3>
              <p className="text-text-secondary">
                Track your performance with real-time charts, P&L tracking, and
                comprehensive trade history.
              </p>
            </Card>

            <Card padding="lg" hover>
              <Lock className="h-12 w-12 text-positive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Wallet</h3>
              <p className="text-text-secondary">
                Non-custodial wallet with 2FA protection. You always control
                your funds on the Polygon network.
              </p>
            </Card>

            <Card padding="lg" hover>
              <TrendingUp className="h-12 w-12 text-neutral mb-4" />
              <h3 className="text-xl font-semibold mb-2">Proven Results</h3>
              <p className="text-text-secondary">
                Consistent profitability with transparent track record and
                verifiable on-chain transactions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join thousands of traders using AI to profit from Bitcoin markets.
          </p>
          <Link href={ROUTES.REGISTER}>
            <Button size="lg" variant="primary">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative h-6 w-6">
                  <Image
                    src="/logo.svg"
                    alt="q1t Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-sm text-text-secondary">
                AI-powered Bitcoin trading platform
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>
                  <Link href={ROUTES.DASHBOARD} className="hover:text-text-primary">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-text-primary">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>
                  <Link href="#" className="hover:text-text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-text-primary">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>
                  <Link href="#" className="hover:text-text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-text-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-text-primary">
                    Risk Disclosure
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-text-secondary">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
