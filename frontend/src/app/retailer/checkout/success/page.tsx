// app/retailer/checkout/success/page.tsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartContext } from '@/context/CartContext';
import { useEffect } from 'react';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCartContext();

  // Clear the cart for this farmer's group on success
  useEffect(() => {
    // The checkout_group was already removed in CheckoutPage on success.
    // Nothing else needed here.
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
        {/* Checkmark animation */}
        <div className="w-20 h-20 bg-[#e8f5ee] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 text-sm mb-1">Your payment is being processed securely.</p>
        <p className="text-gray-500 text-sm mb-6">
          You'll receive a confirmation once your order is dispatched.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-gray-400 mb-0.5">Order Reference</p>
            <p className="text-sm font-mono font-semibold text-gray-700">{orderId}</p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-left">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-700">Funds in Escrow</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Your payment is held securely. Funds will be released to the farmer once delivery is confirmed.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/retailer/market')}
          className="w-full bg-[#2B6E44] text-white font-semibold py-3 rounded-xl hover:bg-[#185c3d] transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}