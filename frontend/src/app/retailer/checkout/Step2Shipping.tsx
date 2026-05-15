// app/retailer/checkout/Step2Shipping.tsx
'use client';
import { useState } from 'react';
import { CheckoutItem, LoanInfo, ShippingData, computeTotals } from '@/services/order.service';
import OrderSummary from './OrderSummary';

type Props = {
  items: CheckoutItem[];
  initialShipping?: ShippingData;
  loanInfo: LoanInfo | null;          // NEW
  useLoanCredit: boolean;              // NEW — controlled from parent
  onUseLoanCreditChange: (v: boolean) => void; // NEW
  onBack: () => void;
  onConfirm: (shipping: ShippingData) => Promise<void>;
  isLoading: boolean;
};

const empty: ShippingData = { fullName: '', streetAddress: '', city: '', zipCode: '', deliveryNote: '' };

export default function Step2Shipping({
  items, initialShipping, loanInfo, useLoanCredit, onUseLoanCreditChange,
  onBack, onConfirm, isLoading
}: Props) {
  const [form, setForm] = useState<ShippingData>(initialShipping ?? empty);
  const [errors, setErrors] = useState<Partial<ShippingData>>({});

  const set = (field: keyof ShippingData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const e: Partial<ShippingData> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.streetAddress.trim()) e.streetAddress = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.zipCode.trim()) e.zipCode = 'Zip code is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onConfirm(form);
  };

  // Compute totals with optional credit deduction — for display only
  const { subtotal, tax, total } = computeTotals(items);
  const creditAvailable = loanInfo?.availableCredit ?? 0;
  // How much credit will actually be applied
  const creditApplied = useLoanCredit ? Math.min(creditAvailable, total) : 0;
  const remainingToPay = Math.max(0, total - creditApplied);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
      {/* ── Left: form ─────────────────────────────────────────────────── */}
      <div className="space-y-5">
        {/* Delivery Destination */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-5 h-5 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="font-semibold text-gray-900">Delivery Destination</h2>
          </div>

          <div className="space-y-4">
            <Field label="Full Name" error={errors.fullName}>
              <input value={form.fullName} onChange={set('fullName')} placeholder="John Miller" className={input(!!errors.fullName)} />
            </Field>
            <Field label="Street Address" error={errors.streetAddress}>
              <input value={form.streetAddress} onChange={set('streetAddress')} placeholder="1248 Rural Route 5" className={input(!!errors.streetAddress)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" error={errors.city}>
                <input value={form.city} onChange={set('city')} placeholder="Lexington" className={input(!!errors.city)} />
              </Field>
              <Field label="Zip Code" error={errors.zipCode}>
                <input value={form.zipCode} onChange={set('zipCode')} placeholder="40502" className={input(!!errors.zipCode)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Delivery Instructions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="font-semibold text-gray-900">Delivery Instructions</h2>
          </div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes for the Courier</label>
          <textarea
            value={form.deliveryNote}
            onChange={set('deliveryNote')}
            rows={4}
            placeholder="e.g., Leave behind the grain silo, call 555-0123 upon arrival."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2B6E44]/30 focus:border-[#2B6E44] transition resize-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">Specific instructions help our agricultural partners ensure safe delivery.</p>
        </div>

        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Order Confirmation
        </button>
      </div>

      {/* ── Right: credit toggle + summary + CTA ──────────────────────── */}
      
        <div className="space-y-3">
        {/* Order Summary (existing component) */}
        <OrderSummary items={items} onEditItems={onBack} />
        

        {/* NEW: Farmer Credit System card — only shown if a loan exists */}
        {loanInfo && loanInfo.availableCredit > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-sm font-semibold text-gray-800">Farmer Credit System</span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">Available Credit Balance</span>
              <span className="text-sm font-bold text-[#2B6E44]">${loanInfo.availableCredit.toFixed(2)}</span>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Apply available farmer credit</span>
              <button
                type="button"
                role="switch"
                aria-checked={useLoanCredit}
                onClick={() => onUseLoanCreditChange(!useLoanCredit)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${useLoanCredit ? 'bg-[#2B6E44]' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${useLoanCredit ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Preview of what credit will cover */}
            {useLoanCredit && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Credit Applied</span>
                  <span className="text-emerald-600 font-semibold">-${creditApplied.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-800">
                  <span>Amount to Pay</span>
                  <span className={remainingToPay === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                    {remainingToPay === 0 ? 'FREE' : `$${remainingToPay.toFixed(2)}`}
                  </span>
                </div>
                {remainingToPay === 0 && (
                  <p className="text-[11px] text-emerald-600 mt-1">
                    ✓ Credit fully covers this order — no card needed!
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-[#2B6E44] text-white font-semibold py-3.5 rounded-xl hover:bg-[#185c3d] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating order...
            </>
          ) : 'Confirm Order'}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          ENCRYPTED TRANSACTION
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const input = (hasError: boolean) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition
   ${hasError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#2B6E44]/30 focus:border-[#2B6E44]'}`;