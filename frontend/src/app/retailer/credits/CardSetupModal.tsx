// app/retailer/credits/CardSetupModal.tsx
// Shown once when retailer has no saved card.
// Uses Stripe SetupIntent to save card for future off-session charges.
'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements, CardNumberElement, CardExpiryElement,
  CardCvcElement, useStripe, useElements,
} from '@stripe/react-stripe-js';
import { createSetupIntent } from '@/services/credits.service';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const stripeStyle = {
  base: { fontSize: '14px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } },
  invalid: { color: '#ef4444' },
};

type Props = { onSuccess: () => void; onClose: () => void };

export default function CardSetupModal({ onSuccess, onClose }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);

  const init = async () => {
    setLoading(true);
    try {
      const { clientSecret: cs } = await createSetupIntent();
      setClientSecret(cs);
    } finally {
      setLoading(false);
    }
  };

  // Initialise on mount
  useState(() => { init(); });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Payment Method</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Save your card once — used for all future credit offers.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {loading || !clientSecret ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#2B6E44] border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SetupForm clientSecret={clientSecret} onSuccess={onSuccess} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

function SetupForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleSave = async () => {
    if (!stripe || !elements) return;
    setSaving(true);
    setError(null);

    const card = elements.getElement(CardNumberElement);
    const { error: stripeErr } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: card! },
    });

    setSaving(false);
    if (stripeErr) { setError(stripeErr.message ?? 'Setup failed.'); }
    else { onSuccess(); }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Card Number</label>
        <div className="border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#2B6E44] focus-within:ring-2 focus-within:ring-[#2B6E44]/20 transition">
          <CardNumberElement options={{ style: stripeStyle, showIcon: true }}/>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Expiry</label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#2B6E44] focus-within:ring-2 focus-within:ring-[#2B6E44]/20 transition">
            <CardExpiryElement options={{ style: stripeStyle }}/>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">CVC</label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#2B6E44] focus-within:ring-2 focus-within:ring-[#2B6E44]/20 transition">
            <CardCvcElement options={{ style: stripeStyle }}/>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !stripe}
        className="w-full bg-[#2B6E44] text-white font-semibold py-3 rounded-xl hover:bg-[#185c3d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Spinner /> : 'Save Card'}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}