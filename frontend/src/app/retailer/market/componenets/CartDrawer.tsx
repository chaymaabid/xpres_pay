'use client';
import React from 'react';
import { useCartContext } from '@/context/CartContext';
import { FarmerGroup } from '@/hooks/useCart';
import PresignedImage from '@/app/components/PresignedProductImage';
import { useRouter } from 'next/navigation';
import { CheckoutGroup } from '@/services/order.service';
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
            <svg
            className="w-4 h-4 text-[#2B6E44]"
            viewBox="0 0 460 460"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            >
            <g>
            <path d="M403.204,336.001c-0.46-0.485-0.984-0.907-1.558-1.256c-12.934-10.356-27.465-18.792-43.163-24.872
		c-0.406-0.199-0.832-0.363-1.276-0.486c-16.135-6.094-33.475-9.705-51.556-10.369c-1.362-1.89-3.576-3.125-6.083-3.125
		s-4.722,1.235-6.083,3.125c-18.082,0.665-35.422,4.275-51.556,10.369c-0.445,0.124-0.872,0.288-1.279,0.487
		c-15.697,6.081-30.228,14.516-43.161,24.871c-0.575,0.349-1.099,0.771-1.56,1.257c-36.586,30.029-59.967,75.583-59.967,126.498
		c0,4.143,3.357,7.5,7.5,7.5s7.5-3.357,7.5-7.5c0-40.628,16.395-77.495,42.908-104.348v102.727c0,0.557,0.065,1.099,0.18,1.621
		c0.741,3.362,3.734,5.879,7.32,5.879s6.578-2.517,7.32-5.879c0.115-0.522,0.18-1.064,0.18-1.621V344.867
		c8.509-6.575,17.746-12.249,27.57-16.878v63.088c0,4.143,3.357,7.5,7.5,7.5h111.255c4.143,0,7.5-3.357,7.5-7.5v-63.088
		c9.824,4.629,19.062,10.302,27.57,16.878v116.012c0,0.557,0.065,1.099,0.18,1.621c0.741,3.362,3.734,5.879,7.32,5.879
		s6.578-2.517,7.32-5.879c0.115-0.522,0.18-1.064,0.18-1.621V358.151c26.514,26.853,42.908,63.72,42.908,104.349
		c0,4.143,3.357,7.5,7.5,7.5s7.5-3.357,7.5-7.5C463.172,411.585,439.79,366.031,403.204,336.001z M251.438,383.577v-61.68
		c12.845-4.409,26.478-7.108,40.628-7.815v19.313c0,4.143,3.357,7.5,7.5,7.5s7.5-3.357,7.5-7.5v-19.313
		c14.149,0.707,27.782,3.406,40.627,7.814v61.681H251.438z"/>
	<path d="M157.678,143.304V7.5c0-4.143-3.357-7.5-7.5-7.5s-7.5,3.357-7.5,7.5v128.304h-30.283V7.5c0-4.143-3.357-7.5-7.5-7.5
		s-7.5,3.357-7.5,7.5v128.304H67.111V7.5c0-4.143-3.357-7.5-7.5-7.5s-7.5,3.357-7.5,7.5v128.304H21.828V7.5
		c0-4.143-3.357-7.5-7.5-7.5s-7.5,3.357-7.5,7.5v135.804c0,21.384,17.396,38.78,38.78,38.78h29.145V462.5c0,4.143,3.357,7.5,7.5,7.5
		s7.5-3.357,7.5-7.5V182.084h29.145C140.281,182.084,157.678,164.688,157.678,143.304z M23.047,150.804h118.412
		c-3.149,9.447-12.07,16.28-22.561,16.28H45.608C35.117,167.084,26.196,160.251,23.047,150.804z"/>
	<path d="M180.893,182.084h33.527c-0.265,2.752-0.407,5.521-0.407,8.291c0,47.175,38.379,85.554,85.554,85.554
		c47.174,0,85.553-38.379,85.553-85.554c0-2.77-0.143-5.539-0.408-8.291h33.248c4.143,0,7.5-3.357,7.5-7.5s-3.357-7.5-7.5-7.5
		h-36.028l-17.409-72.345c-1.72-7.146-6.124-13.07-12.4-16.68c-6.278-3.609-13.61-4.437-20.655-2.328l-31.107,9.313l-31.106-9.313
		c-7.021-2.104-14.37-1.294-20.691,2.278c-6.322,3.571-10.808,9.446-12.631,16.545l-18.632,72.529h-36.405
		c-4.143,0-7.5,3.357-7.5,7.5S176.75,182.084,180.893,182.084z M255.938,91.069c2.734-1.545,5.934-1.89,9.011-0.969l33.258,9.958
		c1.404,0.42,2.898,0.42,4.303,0l33.259-9.958c3.055-0.914,6.207-0.572,8.874,0.962c2.669,1.535,4.549,4.087,5.295,7.187
		l16.565,68.835H232.784l17.673-68.797C251.256,95.178,253.202,92.615,255.938,91.069z M370.119,190.375
		c0,38.903-31.649,70.554-70.553,70.554s-70.554-31.65-70.554-70.554c0-2.776,0.181-5.545,0.502-8.291h140.103
		C369.938,184.831,370.119,187.601,370.119,190.375z"/>
	<path d="M355.19,413.58h-61.25c-4.143,0-7.5,3.357-7.5,7.5s3.357,7.5,7.5,7.5h61.25c4.143,0,7.5-3.357,7.5-7.5
		S359.333,413.58,355.19,413.58z"/>
	<path d="M263.94,413.58h-20c-4.143,0-7.5,3.357-7.5,7.5s3.357,7.5,7.5,7.5h20c4.143,0,7.5-3.357,7.5-7.5
		S268.083,413.58,263.94,413.58z"/>
</g>
            
            </svg>
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