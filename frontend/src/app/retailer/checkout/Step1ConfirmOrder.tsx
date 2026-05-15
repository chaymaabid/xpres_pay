// app/retailer/checkout/Step1ConfirmOrder.tsx
'use client';
import { CheckoutItem, LoanInfo, computeTotals } from '@/services/order.service';
import PresignedImage from '@/app/components/PresignedProductImage';

type Props = {
  items: CheckoutItem[];
  farmerName: string;
  loanInfo: LoanInfo | null;   // NEW
  onItemsChange: (items: CheckoutItem[]) => void;
  onNext: () => void;
};

export default function Step1ConfirmOrder({ items, farmerName, loanInfo, onItemsChange, onNext }: Props) {
  const { subtotal, tax, shipping, total } = computeTotals(items);

  const stockErrors = items.filter(
    i => i.stockAvailable !== undefined && i.quantity > i.stockAvailable
  );
  const canProceed = items.length > 0 && stockErrors.length === 0;

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      onItemsChange(items.filter(i => i.productId !== productId));
    } else {
      onItemsChange(items.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
    }
  };

  const removeItem = (productId: string) => {
    onItemsChange(items.filter(i => i.productId !== productId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 items-start">
      {/* ── Left: info cards ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-100">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
          </svg>
          Guaranteed Fresh
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Review Your<br />Agriculture Order</h1>
          <p className="text-gray-500 text-sm mt-3 leading-relaxed max-w-sm">
            Please verify your items and quantities before moving to shipping.
            Xprespay ensures all products are sourced from verified farmers.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {[
            {
              icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              title: 'Purchase Protection',
              desc: "Your transaction is encrypted. If items don't arrive as described, we'll refund you.",
            },
            {
              icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
              title: 'Tax Exemption',
              desc: 'Applicable farm tax exemptions will be calculated based on your order and transaction fees',
            },
          ].map(b => (
            <div key={b.title} className="flex gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3.5 shadow-sm">
              <div className="w-8 h-8 bg-[#e8f5ee] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={b.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{b.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: itemized summary ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <span className="font-semibold text-gray-900 text-sm">Itemized Summary</span>
            <span className="ml-2 text-gray-400 text-xs">({items.length} item{items.length !== 1 ? 's' : ''})</span>
          </div>
          <span className="text-[11px] font-semibold bg-[#e8f5ee] text-[#2B6E44] px-2.5 py-1 rounded-full">
            Ready for confirmation
          </span>
        </div>

        {stockErrors.length > 0 && (
          <div className="mx-4 mt-4 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Quantity exceeds available stock</p>
              <ul className="mt-1 space-y-0.5">
                {stockErrors.map(i => (
                  <li key={i.productId} className="text-xs text-red-600">
                    <span className="font-medium">{i.productName}</span>: only {i.stockAvailable} available
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No items in cart</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(item => {
              const overStock = item.stockAvailable !== undefined && item.quantity > item.stockAvailable;
              const lowStock = item.stockAvailable !== undefined && item.stockAvailable > 0 && item.stockAvailable <= 5;

              return (
                <div key={item.productId} className={`flex items-center gap-3 px-5 py-4 ${overStock ? 'bg-red-50/50' : ''}`}>
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.imageId ? (
                      <PresignedImage productId={item.productId} imageId={item.imageId} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                    {item.category && (
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide mt-0.5">{item.category}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">${item.price.toFixed(2)} / unit</p>
                    {item.stockAvailable !== undefined && (
                      <p className={`text-[11px] font-medium mt-0.5 ${overStock ? 'text-red-500' : lowStock ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {overStock ? `Only ${item.stockAvailable} in stock` : lowStock ? `Low stock: ${item.stockAvailable} left` : `In stock: ${item.stockAvailable}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs font-bold transition-colors"
                    >−</button>
                    <span className={`text-sm font-bold w-6 text-center ${overStock ? 'text-red-500' : 'text-gray-800'}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      disabled={item.stockAvailable !== undefined && item.quantity >= item.stockAvailable}
                      className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >+</button>
                  </div>

                  <span className="text-sm font-bold text-gray-800 w-16 text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>

                  <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Totals */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Shipping (Flat Rate)</span>
            <span className="font-semibold text-[#2B6E44]">FREE</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Estimated Sales Tax (5%)</span><span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Order Total</span>
            <div className="text-xl text-gray-900">${total.toFixed(2)}</div>
          </div>
        </div>

        {/* NEW: Available credit banner — informational only in step 1 */}
        {loanInfo && loanInfo.availableCredit > 0 && (
          <div className="mx-5 mb-4 flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Available Farmer Credit</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                You have <span className="font-bold">${loanInfo.availableCredit.toFixed(2)}</span> of approved credit with this farmer. You can apply it in the next step.
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full bg-[#2B6E44] text-white font-semibold py-3.5 rounded-xl hover:bg-[#185c3d] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Proceed to Shipping
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}