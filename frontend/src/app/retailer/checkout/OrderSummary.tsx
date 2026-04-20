// app/retailer/checkout/OrderSummary.tsx
// Reusable right-panel used in Step 2 and Step 3
'use client';
import { CheckoutItem, computeTotals } from '@/services/order.service';
import PresignedImage from '@/app/components/PresignedProductImage';

type Props = {
  items: CheckoutItem[];
  onEditItems?: () => void;   // provided only in step 2
};

export default function OrderSummary({ items, onEditItems }: Props) {
  const { subtotal, tax, shipping, total } = computeTotals(items);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <h3 className="font-semibold text-gray-900 text-sm">Order Summary</h3>
        </div>
        {onEditItems && (
          <button onClick={onEditItems} className="text-xs text-[#2B6E44] font-medium hover:underline">
            Edit Items
          </button>
        )}
      </div>

      {/* Item list */}
      <div className="divide-y divide-gray-50">
        {items.map(item => (
          <div key={item.productId} className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {item.imageId ? (
                <PresignedImage
                  productId={item.productId}
                  imageId={item.imageId}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
              <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Shipping Fee</span>
          <span className="font-medium text-[#2B6E44]">FREE</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Estimated Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total Amount</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}