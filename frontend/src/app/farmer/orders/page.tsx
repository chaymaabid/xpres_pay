'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { orderService, OrderListItem, EscrowState } from '@/services/order.service';

const STATUS_OPTIONS = ['All', 'INITIATED', 'LOCKED', 'DELIVERED', 'RELEASED'];

const escrowBadge: Record<EscrowState, { label: string; className: string }> = {
  INITIATED:    { label: 'Initiated',    className: 'bg-blue-50 text-blue-600 border border-blue-100' },
  LOCKED: { label: 'Funds Locked', className: 'bg-amber-50 text-amber-600 border border-amber-100' },
  DELIVERED:    { label: 'Delivered',    className: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  RELEASED:     { label: 'Released',     className: 'bg-green-50 text-green-700 border border-green-200' },
  BLOCKED:   { label: 'Blocked',       className: 'bg-red-50 text-red-600 border border-red-200' },
};

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  const updateParam = useCallback(
    (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value); else params.delete(key);
        if (key !== 'page') params.set('page', '1');
        router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    orderService
      .getOrders({ page, status: status || undefined, search: search || undefined })
      .then(({ data, meta }) => { setOrders(data); setMeta(meta); })
      .finally(() => setLoading(false));
  }, [page, status, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput);
  };

  return (
    <div className="pt-16 p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Order ID or product..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-[#185c3d] transition-colors">
            Search
          </button>
        </form>

        <select
          value={status}
          onChange={(e) => updateParam('status', e.target.value === 'All' ? '' : e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s === 'All' ? '' : s}>{s === 'All' ? 'Status: All' : s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-500">{meta.total} Results</span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No orders found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="px-6 py-3 text-left">Order ID</th>
                <th className="px-6 py-3 text-left">Retailer</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-left">Total Order</th>
                <th className='px-6 py-3 text-left'>Order Earnings </th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => {
                const txStatus = order.transaction?.status as EscrowState | undefined;
                const badge = txStatus ? escrowBadge[txStatus] : null;
                const retailer=order.buyer;

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-600 text-xs">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{retailer.name|| '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{order.orderItems.length} items</td>
                    <td className="px-6 py-4 font-bold text-[#2B6E44]">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-bold text-[primary]"> ${Number(order.transaction.amountToTransfer).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {badge ? (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
                          No transaction
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/farmer/orders/${order.id}`}
                        className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#185c3d] transition-colors"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Page {page} of {meta.totalPages}
            </span>
            <div className="flex gap-1">
              {page > 1 && (
                <button
                  onClick={() => updateParam('page', String(page - 1))}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  ← Prev
                </button>
              )}
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                const p = Math.max(1, page - 2) + i;
                if (p > meta.totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => updateParam('page', String(p))}
                    className={`w-8 h-8 text-xs rounded-lg ${p === page ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                );
              })}
              {page < meta.totalPages && (
                <button
                  onClick={() => updateParam('page', String(page + 1))}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}