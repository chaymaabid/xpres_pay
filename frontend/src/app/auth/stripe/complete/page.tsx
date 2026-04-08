'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          signIn('keycloak', { callbackUrl: '/' });
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
     <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        
        <div className="w-16 h-16 bg-[#2B6E44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"
              stroke="#2B6E44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 6l-10 7L2 6"
              stroke="#2B6E44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">You're almost there!</h2>
        <p className="text-gray-500 text-sm mb-4">
          Your payout account is set up. Now check your email to verify your account before signing in.
        </p>
        <p className="text-gray-400 text-xs">
          Redirecting to sign in in {countdown}s...
        </p>
      </div>
    </div>
  );
}