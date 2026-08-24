'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loading } from '@/components/ui/loading';

export default function ScalpLegacyRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const market = searchParams.get('market') || 'btc-5m';
    router.replace(`/strategies/mid-market?market=${market}&strategy=scalp`);
  }, [router, searchParams]);

  return <Loading text="Redirecting to Market View..." />;
}
