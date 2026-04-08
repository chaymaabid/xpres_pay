'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function StripeRefreshPage() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');

  useEffect(() => {
    if (!accountId) return;
    // Call your backend to get a fresh onboarding link
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/stripe/onboarding-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.url) window.location.href = data.url;
      });
  }, [accountId]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Refreshing your setup link...</p>
    </div>
  );
}