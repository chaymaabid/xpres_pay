// app/retailer/checkout/Step3Payment.tsx
'use client';
import { useState } from 'react';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { CheckoutItem, ShippingData, CreateOrderResponse, computeTotals } from '@/services/order.service';

type Props = {
  items: CheckoutItem[];
  shipping: ShippingData;
  orderResponse: CreateOrderResponse;
  onSuccess: (paymentIntentId: string) => void;
  onCreditSuccess: () => void;
};

const stripeStyle = {
  base: {
    fontSize: '14px',
    color: '#1f2937',
    fontFamily: 'inherit',
    '::placeholder': { color: '#9ca3af' },
  },
  invalid: { color: '#ef4444' },
};

// ── Shared review panel (zero Stripe hooks) ───────────────────────────────────
function ReviewPanel({
  items, shipping, subtotal, tax, creditApplied, remainingAmount, fullyPaid,
}: {
  items: CheckoutItem[];
  shipping: ShippingData;
  subtotal: number;
  tax: number;
  creditApplied: number;
  remainingAmount: number;
  fullyPaid: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Review Order
        </h3>
      </div>

      {/* Shipping address */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-start gap-2.5">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Shipping Address</p>
            <p className="text-sm text-gray-600">{shipping.fullName}</p>
            <p className="text-sm text-gray-500">{shipping.streetAddress}</p>
            <p className="text-sm text-gray-500">{shipping.city}, {shipping.zipCode}</p>
          </div>
        </div>
      </div>

      {/* Delivery method */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-start gap-2.5">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Delivery Method</p>
            <p className="text-sm text-gray-600">Priority Farm-to-Door (2–3 Business Days)</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 py-4 border-b border-gray-50">
        <p className="text-xs font-semibold text-gray-700 mb-3">Items Summary</p>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{item.productName}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-gray-800">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="px-5 py-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Shipping & Handling</span>
          <span className="font-semibold text-[#2B6E44]">FREE</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Estimated Taxes</span><span>${tax.toFixed(2)}</span>
        </div>
        {creditApplied > 0 && (
          <div className="flex justify-between text-sm text-emerald-600 font-medium">
            <span>Farmer Credit Applied</span>
            <span>-${creditApplied.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>Remaining To Pay</span>
          <span className={fullyPaid ? 'text-emerald-600' : 'text-amber-600'}>
            {fullyPaid ? '$0.00' : `$${remainingAmount.toFixed(2)}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── SCENARIO A: Fully covered by credit — NO Stripe hooks at all ───────────────
function FullyCoveredStep({
  items, shipping, subtotal, tax, creditApplied, onCreditSuccess,
}: {
  items: CheckoutItem[];
  shipping: ShippingData;
  subtotal: number;
  tax: number;
  creditApplied: number;
  onCreditSuccess: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-8 items-start">
      <ReviewPanel
        items={items}
        shipping={shipping}
        subtotal={subtotal}
        tax={tax}
        creditApplied={creditApplied}
        remainingAmount={0}
        fullyPaid={true}
      />

      <div className="space-y-4">
        {/* Hero card */}
        <div className="bg-[#2B6E44] rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Fully Covered</h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-xs">
            No additional payment required. Your farmer credit covers this order entirely.
          </p>
        </div>

        {/* Credit breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Total Order Value</span>
            <span>${(subtotal + tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-emerald-600 font-medium">
            <span>Farmer Credit Applied</span>
            <span>-${creditApplied.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Remaining To Pay</span>
            <span className="text-emerald-600">$0.00</span>
          </div>
        </div>

        <button
          onClick={onCreditSuccess}
          className="w-full bg-[#2B6E44] text-white font-bold py-4 rounded-xl hover:bg-[#185c3d] transition-colors text-base"
        >
          Confirm Order
        </button>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-2">
          By confirming this order, the payment will be completed and your available farmer
          credit balance will be adjusted accordingly.
        </p>
      </div>
    </div>
  );
}

// ── SCENARIO B & C: Card needed — Stripe hooks are safe here ──────────────────
// This component is ONLY rendered when checkout/page.tsx wraps it in <Elements>,
// so useStripe() / useElements() always have a valid context.
function CardPaymentStep({
  items, shipping, subtotal, tax, creditApplied, remainingAmount, clientSecret, onSuccess,
}: {
  items: CheckoutItem[];
  shipping: ShippingData;
  subtotal: number;
  tax: number;
  creditApplied: number;
  remainingAmount: number;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    setIsProcessing(false);

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-8 items-start">
      <ReviewPanel
        items={items}
        shipping={shipping}
        subtotal={subtotal}
        tax={tax}
        creditApplied={creditApplied}
        remainingAmount={remainingAmount}
        fullyPaid={false}
      />

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Method</h2>
          <p className="text-sm text-gray-500 mb-6">
            {creditApplied > 0
              ? `Your credit covered $${creditApplied.toFixed(2)}. Please pay the remaining $${remainingAmount.toFixed(2)} by card.`
              : 'Please enter your secure payment details below to complete your order.'}
          </p>

          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                Card Number
                <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  Secure Field
                </span>
              </label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#2B6E44]/30 focus-within:border-[#2B6E44] transition">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M1 10h22" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div className="flex-1">
                  <CardNumberElement options={{ style: stripeStyle, showIcon: true }} />
                </div>
              </div>
            </div>

            {/* Expiry + CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                  Expiry Date
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#2B6E44]/30 focus-within:border-[#2B6E44] transition">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <div className="flex-1">
                    <CardExpiryElement options={{ style: stripeStyle }} />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">CVC / CVV</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#2B6E44]/30 focus-within:border-[#2B6E44] transition">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <div className="flex-1">
                    <CardCvcElement options={{ style: stripeStyle }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-between mt-5 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              SSL ENCRYPTED TRANSACTION
            </div>
            <span className="text-[10px] text-gray-400 font-semibold tracking-wide">POWERED BY STRIPE</span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isProcessing || !stripe}
          className="w-full bg-[#2B6E44] text-white font-bold py-4 rounded-xl hover:bg-[#185c3d] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-base"
        >
          {isProcessing ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing Payment...
            </>
          ) : `Process Payment ($${remainingAmount.toFixed(2)})`}
        </button>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-2">
          By clicking "Process Payment", you authorize Xprespay to charge your designated card
          for the amount indicated. You agree to our terms of service and acknowledge that your
          payment information is handled securely according to PCI DSS standards.
        </p>
      </div>
    </div>
  );
}

// ── Main export: routes to the correct subcomponent, no Stripe hooks here ──────
//
// WHY THIS WORKS:
// useStripe() / useElements() are React hooks — they must always be called in
// the same order and always inside an <Elements> provider. If we called them at
// the top of this component and then conditionally skipped the card UI, React
// would still call the hooks but <Elements> might not be in the tree (Scenario A),
// causing the "Could not find Elements context" crash.
//
// Solution: move the hooks into CardPaymentStep, which is ONLY rendered when
// checkout/page.tsx wraps it with <Elements>. FullyCoveredStep has no hooks at
// all, so it renders safely without any Stripe provider.
//
export default function Step3Payment({ items, shipping, orderResponse, onSuccess, onCreditSuccess }: Props) {
  const { subtotal, tax } = computeTotals(items);
  const { fullyPaid, creditApplied, remainingAmount, clientSecret } = orderResponse;

  if (fullyPaid) {
    return (
      <FullyCoveredStep
        items={items}
        shipping={shipping}
        subtotal={subtotal}
        tax={tax}
        creditApplied={creditApplied}
        onCreditSuccess={onCreditSuccess}
      />
    );
  }

  // clientSecret is guaranteed non-null when fullyPaid is false
  return (
    <CardPaymentStep
      items={items}
      shipping={shipping}
      subtotal={subtotal}
      tax={tax}
      creditApplied={creditApplied}
      remainingAmount={remainingAmount}
      clientSecret={clientSecret!}
      onSuccess={onSuccess}
    />
  );
}