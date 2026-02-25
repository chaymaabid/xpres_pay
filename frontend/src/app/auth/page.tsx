'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Role = 'RETAILER' | 'FARMER' | null;

export default function AuthPage() {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = () => {
  if (!role) return;
  // Navigate to registration form with selected role
  router.push(`/auth/register?role=${role}`);
};


  return (
    <div className="min-h-screen flex flex-col bg-white">

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">

        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-500 mb-8">
          <span className="w-1.5 h-1.5 bg-[#2B6E44] rounded-full"/>
          Agri-Fintech Ecosystem
        </div>

        <h1 className="text-5xl font-bold text-center text-gray-900 mb-4">
          Welcome to <span className="text-[#2B6E44]">Xprespay</span>
        </h1>

        <p className="text-gray-500 text-center text-lg mb-4 max-w-lg leading-relaxed">
          The high-integrity platform for secure agricultural trade.
        </p>
        
        <p className="text-gray-600 text-center font-medium mb-12">
          Select your role below to create an account
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-10">

          <button
            onClick={() => setRole(r => r === 'RETAILER' ? null : 'RETAILER')}
            className={`text-left p-8 rounded-2xl border-2 transition-all duration-200 w-full
              ${role === 'RETAILER'
                ? 'border-[#2B6E44] bg-green-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6
              ${role === 'RETAILER' ? 'bg-[#2B6E44]/10' : 'bg-gray-100'}`}>
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 64 64">
                <g id="SVGRepo_bgCarrier" strokeWidth={2}></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M52,27.18V52.76a2.92,2.92,0,0,1-3,2.84H15a2.92,2.92,0,0,1-3-2.84V27.17"></path><polyline points="26.26 55.52 26.26 38.45 37.84 38.45 37.84 55.52"></polyline><path d="M8.44,19.18s-1.1,7.76,6.45,8.94a7.17,7.17,0,0,0,6.1-2A7.43,7.43,0,0,0,32,26a7.4,7.4,0,0,0,5,2.49,11.82,11.82,0,0,0,5.9-2.15,6.66,6.66,0,0,0,4.67,2.15,8,8,0,0,0,7.93-9.3L50.78,9.05a1,1,0,0,0-.94-.65H14a1,1,0,0,0-.94.66Z"></path><line x1="8.44" y1="19.18" x2="55.54" y2="19.18"></line><line x1="21.04" y1="19.18" x2="21.04" y2="8.4"></line><line x1="32.05" y1="19.18" x2="32.05" y2="8.4"></line><line x1="43.01" y1="19.18" x2="43.01" y2="8.4"></line></g>
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900 text-xl mb-3">I am a Retailer </h2>
            <hr className="border-gray-200 mb-4"/>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Procure high-quality agricultural inputs directly from verified farmers.
              Manage credit limits, track shipments, and secure your funds in escrow until delivery is confirmed.
            </p>
            <hr className="border-gray-200 mb-4"/>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Instant Escrow Access
            </div>
          </button>

          {/* Farmer */}
          <button
            onClick={() => setRole(r => r === 'FARMER' ? null : 'FARMER')}
            className={`text-left p-8 rounded-2xl border-2 transition-all duration-200 w-full
              ${role === 'FARMER'
                ? 'border-[#2B6E44] bg-green-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6
              ${role === 'FARMER' ? 'bg-[#2B6E44]/10' : 'bg-gray-100'}`}>
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 32 32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M29.9,16.5C29.7,16.2,29.4,16,29,16c-2.2,0-4.3,1-5.6,2.8L22.5,20c-1.1,1.3-2.8,2-4.5,2h-3c-0.6,0-1-0.4-1-1s0.4-1,1-1h1.9 c1.6,0,3.1-1.3,3.1-2.9c0,0,0-0.1,0-0.1c0-0.5-0.5-1-1-1h0v-5.1c3.9-0.5,7-3.9,7-7.9c0-0.6-0.4-1-1-1c-2.4,0-4.5,1.1-6,2.7V2 c0-0.6-0.4-1-1-1s-1,0.4-1,1v5.7C15.5,6.1,13.4,5,11,5c-0.6,0-1,0.4-1,1c0,4.1,3.1,7.4,7,7.9V16h-4.1c-3.6,0-6.5,1.6-8.1,4.2 l-2.7,4.2c-0.2,0.3-0.2,0.7,0,1l3,5c0.1,0.2,0.4,0.4,0.6,0.5c0.1,0,0.1,0,0.2,0c0.2,0,0.4-0.1,0.6-0.2c3.8-2.5,8.2-3.8,12.7-3.8 c3.3,0,6.3-1.8,7.9-4.7l2.7-4.8C30,17.2,30,16.8,29.9,16.5z"/>
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900 text-xl mb-3">I am a Farmer </h2>
            <hr className="border-gray-200 mb-4"/>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              List your products to a global network of trusted retailers.
              Benefit from guaranteed payouts through our integrated escrow system
              and professional Stripe-managed financial tracking.
            </p>
            <hr className="border-gray-200 mb-4"/>
            <div className="flex items-center gap-1.5 text-sm text-[#D4A843] font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Requires Stripe Onboarding
            </div>
          </button>

        </div>
        <button
          onClick={handleSignup}
          disabled={!role || loading}
          className={`flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200
            ${role && !loading
              ? 'bg-[#2B6E44] hover:bg-[#1a4a2e] text-white shadow-sm cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              Creating account...
            </>
          ) : (
            <>
              Sign Up as {role || 'Role'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </>
          )}
        </button>

        <div className="flex items-center gap-6 mt-6 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Bank-grade Encryption
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            Stripe Verified Payouts
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center max-w-sm">
          By continuing, you agree to Xprespay's{' '}
          <a href="#" className="underline">Terms of Service</a> and{' '}
          <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </main>

      <footer className="border-t border-gray-100 px-6 py-4 flex items-center justify-between text-sm text-gray-400">
        <span>© 2026 Xprespay Agri-Fintech. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-gray-700">Privacy Policy</a>
          <a href="#" className="hover:text-gray-700">Terms of Service</a>
          <a href="#" className="hover:text-gray-700">Trust & Safety</a>
        </div>
      </footer>
    </div>
  );
}