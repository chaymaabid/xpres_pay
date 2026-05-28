'use client';
import React from 'react';
import { useCartContext } from '@/context/CartContext';
import { FarmerGroup } from '@/hooks/useCart';
import PresignedImage from '@/app/components/PresignedProductImage';
import { useRouter } from 'next/navigation';
import { CheckoutGroup } from '@/services/order.service';
import FarmerIcon from '@/app/components/FarmerIcon';
export default function CartDrawer() {
  const {
    isOpen,
    closeCart,
    groupedByFarmer,
    totalItems,
    updateQty,
    removeItem,
    clearFarmerCart,
  } = useCartContext();

  const router = useRouter();

  const handleOrder = (group: FarmerGroup) => {
  // 1. Serialize the farmer group into sessionStorage
  
  const checkoutGroup: CheckoutGroup = {
    farmerId: group.farmerId,
    farmerName: group.farmerName,
    items: group.items.map(i => ({
      productId: i.productId,
      productName: i.productName,
      price: i.price,
      quantity: i.quantity,
      imageId: i.imageId,
      stockAvailable:i.stockAvailable,
    })),
  };
  sessionStorage.setItem('checkout_group', JSON.stringify(checkoutGroup));
 
  // 2. Close the cart drawer
  closeCart();
 
  // 3. Navigate to checkout
  router.push('/retailer/checkout');
} ;

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* ── Drawer panel ─────────────────────────────────────────────────── */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[420px] max-w-full bg-gray-50 shadow-2xl z-50
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#2B6E44]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 10 19h9v-2h-8.42a.25.25 0 0 1-.22-.37L11.1 14h5.45a2 2 0 0 0 1.8-1.11l3.58-6.49A1 1 0 0 0 21 5H6.21l-.94-2zM7 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
            </svg>
            <h2 className="font-semibold text-gray-900 text-base">Your Cart</h2>
            {totalItems > 0 && (
              <span className="bg-[#2B6E44] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Body: scrollable farmer groups ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {groupedByFarmer.length === 0 ? (
            <EmptyCart />
          ) : (
            groupedByFarmer.map(group => (
              <FarmerCard
                key={group.farmerId}
                group={group}
                onUpdateQty={updateQty}
                onRemoveItem={removeItem}
                onCancel={() => clearFarmerCart(group.farmerId)}
                onOrder={() => handleOrder(group)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Farmer card (matches your screenshot design) ─────────────────────────────
function FarmerCard({
  group,
  onUpdateQty,
  onRemoveItem,
  onCancel,
  onOrder,
}: {
  group: FarmerGroup;
  onUpdateQty: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCancel: () => void;
  onOrder: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Farmer header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#e8f5ee] rounded-full flex items-center justify-center">
            <FarmerIcon className="w-4 h-4 text-[#2B6E44]" />
            
          </div>
          <span className="font-semibold text-gray-800 text-sm">{group.farmerName}</span>
        </div>
        {/* Star rating badge */}
        <span className="flex items-center gap-1 bg-[#2B6E44] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
          4.5
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </span>
      </div>

      {/* Product rows */}
      <div className="divide-y divide-gray-50">
        {group.items.map(item => (
          <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {item.imageId ? (
                <PresignedImage
                  productId={item.productId}
                  imageId={item.imageId}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Name + qty controls */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
              {/* Quantity stepper */}
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
                  className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 text-xs font-bold"
                >
                  −
                </button>
                <span className="text-sm font-semibold text-gray-800 w-5 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                  disabled={item.stockAvailable!== undefined && item.quantity>=item.stockAvailable}
                  className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price + delete */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <button
                onClick={() => onRemoveItem(item.productId)}
                className="text-gray-300 hover:text-red-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
              <span className="text-sm font-bold text-gray-800">
                ${(item.price * item.quantity).toFixed(0)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer: total + actions */}
      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between gap-2 border-t border-gray-100">
        <span className="text-sm font-semibold text-gray-700">
          Total: <span className="text-[#2B6E44]">${group.total.toFixed(0)}</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            annuler
          </button>
          <button
            onClick={onOrder}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2B6E44] rounded-lg hover:bg-[#185c3d] transition-colors"
          >
            Commander
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 10 19h9v-2h-8.42a.25.25 0 0 1-.22-.37L11.1 14h5.45a2 2 0 0 0 1.8-1.11l3.58-6.49A1 1 0 0 0 21 5H6.21l-.94-2z"/>
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500">Your cart is empty</p>
      <p className="text-xs text-gray-400 mt-1">Add products from the catalog</p>
    </div>
  );
}