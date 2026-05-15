// app/farmer/escrow/EscrowCard.tsx
'use client';
import { useState } from 'react';
import { EscrowOrder } from '@/services/escrow.service';
import ProofOfDeliveryModal from './ProofOfDeliveryModal';

export default function EscrowCard({
  order,
  onReleased,
}: {
  order: EscrowOrder;
  onReleased: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const shortId    = order.id.replace(/-/g, '').substring(0, 8).toUpperCase();
  const amount     = Number(order.transaction.amountToTransfer);
  const createdAt  = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Card header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <span className="text-xs font-mono font-semibold text-gray-600">
            ORDER ID: {shortId}
          </span>
          <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">
            LOCKED – AWAITING DELIVERY
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Retailer info */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1.5">Retailer</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {order.buyer.name ?? order.buyer.email}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-gray-800 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                VERIFIED
              </div>
            </div>
          </div>

          {/* Locked amount */}
          <div className="bg-amber-50 rounded-xl px-4 py-3 flex items-center justify-between border border-amber-100">
            <div>
              <p className="text-[10px] text-amber-600 uppercase tracking-widest font-semibold mb-0.5">Funds Locked</p>
              <p className="text-2xl font-bold text-gray-900">${amount}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
          </div>

          {/* Created date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Created on {createdAt}
          </div>

          {/* CTA */}
          <button
            onClick={() => setModalOpen(true)}
            className="w-full bg-[#2B6E44] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[#185c3d] transition-colors"
          >
            Upload Proof of Delivery
          </button>
        </div>
      </div>

      {modalOpen && (
        <ProofOfDeliveryModal
          orderId={order.id}
          shortId={shortId}
          lockedAmount={amount}
          onClose={() => setModalOpen(false)}
          onReleased={() => {
            setModalOpen(false);
            onReleased();
          }}
        />
      )}
    </>
  );
}