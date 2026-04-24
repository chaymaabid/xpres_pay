// app/farmer/escrow/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { getFarmerEscrows, EscrowOrder } from '@/services/escrow.service';
import EscrowCard from './EscrowCard';

export default function ActiveEscrowPage() {
  const [orders, setOrders]   = useState<EscrowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFarmerEscrows();
      setOrders(data);
    } catch {
      setError('Failed to load escrows. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="pt-20 p-8 ">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">Active Escrows</h1>
            </div>
            {!loading && orders.length > 0 && (
              <span className="bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100 px-2.5 py-1 rounded-full">
                {orders.length} Pending Delivery
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage and fulfill your pending agricultural contracts.
          </p>
        </div>
        <button className="text-sm text-[#2B6E44] font-medium hover:underline transition-colors">
          View all transactions
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse"/>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 max-w-md">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No active escrows</h3>
          <p className="text-gray-500 text-sm max-w-xs">
            Orders with locked funds awaiting delivery will appear here.
          </p>
        </div>
      )}

      {/* Cards grid */}
      {!loading && !error && orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map(order => (
            <EscrowCard
              key={order.id}
              order={order}
              onReleased={load}   // refresh the list after release
            />
          ))}
        </div>
      )}
    </div>
  );
}