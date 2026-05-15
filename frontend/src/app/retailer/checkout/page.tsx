// app/retailer/checkout/page.tsx
// Main checkout container — manages step state and all shared data
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import CheckoutProgressBar from './CheckoutProgressBar';
import Step1ConfirmOrder from './Step1ConfirmOrder';
import Step2Shipping from './Step2Shipping';
import Step3Payment from './Step3Payment';
import {
  CheckoutItem,
  CheckoutGroup,
  ShippingData,
  CreateOrderResponse,
  LoanInfo,
  createOrder,
  computeTotals,
  getLoanInfo,
} from '@/services/order.service';
import { useCartContext } from '@/context/CartContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const router = useRouter();
  const { clearFarmerCart } = useCartContext();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [farmerId, setFarmerId] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [shipping, setShipping] = useState<ShippingData | undefined>(undefined);
  const [orderResponse, setOrderResponse] = useState<CreateOrderResponse | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // NEW: loan state — fetched once we know the farmerId
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [useLoanCredit, setUseLoanCredit] = useState(false);

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

      // Fetch loan info as soon as we know who the farmer is
      getLoanInfo(group.farmerId).then(info => {
        setLoanInfo(info);
        // Auto-enable credit if available
        if (info && info.availableCredit > 0) setUseLoanCredit(true);
      });
    } catch {
      router.replace('/retailer/market');
    }
  }, [router]);

  // Step 2 → 3: call backend to create the order
  const handleConfirmOrder = async (shippingData: ShippingData) => {
    setShipping(shippingData);
    setIsCreatingOrder(true);
    setOrderError(null);
    const total = computeTotals(items).total;
    try {
      const response = await createOrder(items, shippingData, total, useLoanCredit);
      setOrderResponse(response);
      clearFarmerCart(farmerId);
      setStep(3);
    } catch (err: any) {
      setOrderError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Step 3 success
  const handlePaymentSuccess = (paymentIntentId: string) => {
    sessionStorage.removeItem('checkout_group');
    router.push(`/retailer/checkout/success?orderId=${orderResponse?.orderId}`);
  };

  // Fully paid by credit — skip Stripe entirely
  const handleCreditSuccess = () => {
    sessionStorage.removeItem('checkout_group');
    router.push(`/retailer/checkout/success?orderId=${orderResponse?.orderId}`);
  };

  if (items.length === 0 && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2B6E44] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Determine what to wrap in <Elements>
  // We only need Elements when there's a clientSecret (partial or full card payment)
  const needsStripe = step === 3 && orderResponse && !orderResponse.fullyPaid && orderResponse.clientSecret;

  const step3Content = step === 3 && orderResponse ? (
    <Step3Payment
      items={items}
      shipping={shipping!}
      orderResponse={orderResponse}
      onSuccess={handlePaymentSuccess}
      onCreditSuccess={handleCreditSuccess}
    />
  ) : null;

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <CheckoutProgressBar currentStep={step} />

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {orderError && (
          <div className="mb-6 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{orderError}</p>
          </div>
        )}

        {step === 1 && (
          <Step1ConfirmOrder
            items={items}
            farmerName={farmerName}
            loanInfo={loanInfo}
            onItemsChange={setItems}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2Shipping
            items={items}
            initialShipping={shipping}
            loanInfo={loanInfo}
            useLoanCredit={useLoanCredit}
            onUseLoanCreditChange={setUseLoanCredit}
            onBack={() => setStep(1)}
            onConfirm={handleConfirmOrder}
            isLoading={isCreatingOrder}
          />
        )}

        {/* Wrap in Elements only if Stripe is needed */}
        {step === 3 && orderResponse && (
          needsStripe ? (
            <Elements stripe={stripePromise} options={{ clientSecret: orderResponse.clientSecret! }}>
              {step3Content}
            </Elements>
          ) : (
            step3Content
          )
        )}
      </main>

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