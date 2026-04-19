import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ErrorBoundaryProvider } from '@/components/providers/error-boundary-provider';
import { AuthProvider } from '@/context/auth-context';
import { SocketProvider } from '@/context/socket-context';
import { ToastProvider } from '@/context/toast-context';
import { APP_NAME } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'AI-powered Bitcoin trading platform with real-time signals and automated execution',
  keywords: ['bitcoin', 'trading', 'AI', 'crypto', 'polymarket', 'prediction markets'],
  authors: [{ name: 'q1t Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#0A0B0D',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ErrorBoundaryProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
              <ToastProvider />
            </SocketProvider>
          </AuthProvider>
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}
