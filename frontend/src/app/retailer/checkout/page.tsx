// app/retailer/checkout/page.tsx
// Main checkout container — manages step state and all shared data
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import CheckoutProgressBar from './CheckoutProgressBar';
import Step1ConfirmOrder from './Step1ConfirmOrder';
import Step2Shipping from './Step2Shipping';
import Step3Payment from './Step3Payment';
import { CheckoutItem, CheckoutGroup, ShippingData, CreateOrderResponse } from '@/services/order.service';
import { createOrder ,computeTotals } from '@/services/order.service';
import { useCartContext } from '@/context/CartContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const router = useRouter();
  const { clearFarmerCart } = useCartContext();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [farmerId, setFarmerId] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [shipping, setShipping] = useState<ShippingData | undefined>(undefined);
  const [orderResponse, setOrderResponse] = useState<CreateOrderResponse | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('checkout_group');
    if (!raw) {
      router.replace('/retailer/market');
      return;
    }
    try {
      const group: CheckoutGroup = JSON.parse(raw);
      setItems(group.items);
      setFarmerName(group.farmerName);
      setFarmerId(group.farmerId);
    } catch {
      router.replace('/retailer/market');
    }
  }, [router]);

  // ── Step 2 → 3: call backend ────────────────────────────────────────────────
  const handleConfirmOrder = async (shippingData: ShippingData) => {
    setShipping(shippingData);
    setIsCreatingOrder(true);
    setOrderError(null);
    const total=computeTotals(items).total
    try {
      const response = await createOrder(items,shippingData,total);
      setOrderResponse(response);
      clearFarmerCart(farmerId);
      setStep(3);
    } catch (err: any) {
      setOrderError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // ── Step 3 success ──────────────────────────────────────────────────────────
  const handlePaymentSuccess = (paymentIntentId: string) => {
    sessionStorage.removeItem('checkout_group');
    router.push(`/retailer/checkout/success?orderId=${orderResponse?.orderId}`);
  };

  if (items.length === 0 && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2B6E44] border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className=" p-8 min-h-screen bg-gray-50">
      
      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <CheckoutProgressBar currentStep={step} />

      {/* ── Step content ────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Error banner (step 2 → 3 API failure) */}
        {orderError && (
          <div className="mb-6 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm text-red-600">{orderError}</p>
          </div>
        )}

        {step === 1 && (
          <Step1ConfirmOrder
            items={items}
            farmerName={farmerName}
            onItemsChange={setItems}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2Shipping
            items={items}
            initialShipping={shipping}
            onBack={() => setStep(1)}
            onConfirm={handleConfirmOrder}
            isLoading={isCreatingOrder}
          />
        )}

        {step === 3 && orderResponse && (
          <Elements stripe={stripePromise} options={{ clientSecret: orderResponse.clientSecret }}>
            <Step3Payment
              items={items}
              shipping={shipping!}
              clientSecret={orderResponse.clientSecret}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-4 px-6 flex items-center justify-between text-xs text-gray-400">
        <span>© 2024 Xprespay. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}