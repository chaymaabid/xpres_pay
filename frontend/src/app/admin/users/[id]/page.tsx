'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminService, AdminUserDetail, AdminUserOrder, Loan, TrustDevice } from '@/services/users.service';
import FarmerIcon from '@/app/components/FarmerIcon';

type Tab = 'overview' | 'orders' | 'products' | 'trust' | 'credit';

const escrowBadge: Record<string, { label: string; className: string }> = {
  INITIATED: { label: 'Initiated',    className: 'bg-blue-50 text-blue-600 border border-blue-100' },
  LOCKED:    { label: 'Funds Locked', className: 'bg-amber-50 text-amber-600 border border-amber-100' },
  DELIVERED: { label: 'Delivered',    className: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  RELEASED:  { label: 'Released',     className: 'bg-green-50 text-green-700 border border-green-200' },
  BLOCKED:   { label: 'Blocked',      className: 'bg-red-50 text-red-600 border border-red-100' },
};

const creditOfferBadge: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'Pending',   className: 'bg-amber-50 text-amber-600 border border-amber-100' },
  ACCEPTED:  { label: 'Accepted',  className: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  REJECTED:  { label: 'Rejected',  className: 'bg-red-50 text-red-600 border border-red-100' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-50 text-gray-400 border border-gray-100' },
};

const roleBadge: Record<string, { label: string; className: string }> = {
  FARMER:   { label: 'Farmer',   className: 'bg-amber-50 text-amber-600 border border-amber-100' },
  RETAILER: { label: 'Retailer', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
  ADMIN:    { label: 'Admin',    className: 'bg-purple-50 text-purple-600 border border-purple-100' },
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser]       = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<Tab>('overview');

  useEffect(() => {
    setLoading(true);
    adminService
      .getUserDetail(id)
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-32 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="py-32 text-center text-gray-400 text-sm">
        {error ?? 'User not found.'}
      </div>
    );
  }

  const initials = (user.name ?? user.email)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const badge = roleBadge[user.role];

  const TABS: { key: Tab; label: string }[] =
  user.role === 'RETAILER'
    ? [
        { key: 'overview', label: 'Overview' },
        { key: 'orders', label: `Orders (${user.stats.totalOrders})` },
        { key: 'trust', label: 'Trust & KYC' },
        { key: 'credit', label: 'Credit & Loans' },
      ]
    : [
        { key: 'overview', label: 'Overview' },
        { key: 'products', label: `Products (${user.stats.totalProducts})` },
        { key: 'trust', label: 'Trust & KYC' },
        { key: 'credit', label: 'Credit & Loans' },
      ];

  return (
    <div className="p-6 pt-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        ← Back to users
      </Link>

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-[#e8f4ee] flex items-center justify-center text-[#2B6E44] text-lg font-bold flex-shrink-0">
            {user.role=='FARMER'?<FarmerIcon className="w-8 h-8 primary" />:<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 20 20"><path fill="#000000" d="M7 13a1 1 0 1 0 0-2a1 1 0 0 0 0 2Zm4-1a1 1 0 1 1-2 0a1 1 0 0 1 2 0Zm2 1a1 1 0 1 0 0-2a1 1 0 0 0 0 2ZM4 3.293A1 1 0 0 1 4.707 3h10.586a1 1 0 0 1 .707.293l2.642 2.641c.762.763.222 2.066-.856 2.066H17v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8h-.786C1.136 8 .597 6.697 1.36 5.934L4 3.293ZM16 15V8H4v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1Zm1.786-8a.21.21 0 0 0 .149-.358L15.293 4H4.707L2.066 6.642A.21.21 0 0 0 2.214 7h15.572Z"/></svg>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-gray-900">{user.name ?? 'No name'}</h1>
              {badge && (
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                  {badge.label}
                </span>
              )}
              {user.trustProfile?.isVerified && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>
              Joined{' '}
              <span className="text-gray-600 font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

    {tab === 'overview' && <OverviewTab user={user} />}
    {tab === 'orders' && user.role === 'RETAILER' && (<OrdersTab orders={user.ordersAsBuyer} />)}
    {tab === 'products' && user.role === 'FARMER' && (<ProductsTab products={user.products} />)}
    {tab === 'trust' && <TrustTab user={user} />}
    {tab === 'credit' && <CreditTab user={user} />}
  </div>
  );}

function OverviewTab({ user }: { user: AdminUserDetail }) {
  const { stats } = user;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {user.role=='RETAILER'&&
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">Orders</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">Total spent</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalSpent}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">Credit given</p>
              <p className="text-lg font-bold text-gray-900">$${stats.totalCreditGiven.toFixed(2)}</p>
            </div>
          </>
          }
          {user.role=='FARMER'&&
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">Products</p>
              <p className="text-lg font-bold text-gray-900">{ stats.totalProducts}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">Total earning</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalEarning}</p>
            </div>
             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">Credit taken</p>
              <p className="text-lg font-bold text-gray-900">$${stats.totalCreditTaken.toFixed(2)}</p>
            </div>
          </>
          }
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">Devices</p>
              <p className="text-lg font-bold text-gray-900">{ stats.totalDevices}</p>
            </div>
    
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: AdminUserOrder[] }) {
  if (orders.length === 0) {
    return <div className="py-16 text-center text-gray-400 text-sm">No orders found.</div>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: AdminUserOrder }) {
  const [open, setOpen] = useState(false);
  const txStatus = order.transaction?.status;
  const badge    = txStatus ? escrowBadge[txStatus] : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-gray-600 text-xs">
            {order.id.slice(0, 8).toUpperCase()}
          </span>
          {badge ? (
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
              No transaction
            </span>
          )}
          <span className="font-bold text-[#2B6E44]">
            ${Number(order.totalAmount).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="text-gray-300 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-50 px-6 pb-5 pt-4 bg-gray-50 space-y-4">
          {/* Items */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Items</p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {order.orderItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1.5 text-gray-700">{item.product.name}</td>
                    <td className="py-1.5 text-gray-400 text-xs text-center">× {item.quantity}</td>
                    <td className="py-1.5 font-medium text-gray-900 text-right">
                      ${Number(item.unitPriceAtOrder).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Transaction */}
          {order.transaction && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Transaction</p>
              <InfoTable
                rows={[
                  { label: 'Total paid',     value: `$${Number(order.transaction.totalPaid).toFixed(2)}` },
                  { label: 'Platform fee',   value: `$${Number(order.transaction.platformFee).toFixed(2)}` },
                  { label: 'To transfer',    value: `$${Number(order.transaction.amountToTransfer).toFixed(2)}` },
                  { label: 'Payment intent', value: order.transaction.paymentIntentId ?? '—', mono: true },
                ]}
              />
            </div>
          )}

          {/* Shipping */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Shipping address</p>
            <p className="text-sm text-gray-600">{order.shippingAddress}</p>
            {order.note && <p className="text-xs text-gray-400 mt-1 italic">{order.note}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsTab({
  products,
}: {
  products: AdminUserDetail['products'];
}) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">
        No products found.
      </div>
    );
  }

  return (
    <SectionCard title={`Products listed (${products.length})`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
            <th className="py-2 text-left font-medium">Name</th>
            <th className="py-2 text-left font-medium">Price</th>
            <th className="py-2 text-left font-medium">Stock</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {products.map((p) => (
            <tr key={p.id}>
              <td className="py-3 text-gray-700">{p.name}</td>

              <td className="py-3 font-bold text-[#2B6E44]">
                ${Number(p.price).toFixed(2)}
              </td>

              <td className="py-3 text-gray-400">
                {p.stockAvailable}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
function TrustTab({ user }: { user: AdminUserDetail }) {
  const tp = user.trustProfile;

  if (!tp) {
    return <div className="py-16 text-center text-gray-400 text-sm">No trust profile found.</div>;
  }

  const scoreColor =
    tp.trustScore >= 7 ? 'text-[#2B6E44]' :
    tp.trustScore >= 4 ? 'text-amber-600'  :
                         'text-red-600';

  const scoreBg =
    tp.trustScore >= 7 ? 'bg-[#e8f4ee]' :
    tp.trustScore >= 4 ? 'bg-amber-50'  :
                         'bg-red-50';

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="space-y-1">
            <p className="text-sm text-gray-400">
              Status:{' '}
              {tp.isVerified ? (
                <span className="text-emerald-600 font-semibold">Verified</span>
              ) : (
                <span className="text-gray-500 font-semibold">Unverified</span>
              )}
            </p>
            <p className="text-sm text-gray-400">
              ID number:{' '}
              <span className={`font-mono ${scoreColor}`}>{tp.idNumber ?? '—'}</span>
            </p>
            <p className="text-sm text-gray-400">
              Trust Score:{' '}
              <span className="font-mono text-gray-700">{tp.trustScore ?? '—'}</span>
            </p>
            <p className="text-sm text-gray-400">
              Last updated:{' '}
              <span className="text-gray-700">
                {new Date(tp.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Devices */}
      <SectionCard title={`Trusted devices (${tp.devices.length})`}>
        {tp.devices.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No devices registered.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="py-2 text-left font-medium">Device</th>
                <th className="py-2 text-left font-medium">Fingerprint</th>
                <th className="py-2 text-left font-medium">Last used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tp.devices.map((device) => (
                <tr key={device.id}>
                  <td className="py-2.5 text-gray-700">{device.deviceName ?? 'Unknown'}</td>
                  <td className="py-2.5 font-mono text-xs text-gray-400">
                    {device.deviceFingerprint.slice(0, 20)}…
                  </td>
                  <td className="py-2.5 text-gray-400 text-xs">
                    {new Date(device.lastUsed).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Credit & Loans ───────────────────────────────────────────────────────────

function CreditTab({ user }: { user: AdminUserDetail }) {
  const hasCredit = user.loansGiven.length + user.loansTaken.length > 0;

  if (!hasCredit) {
    return <div className="py-16 text-center text-gray-400 text-sm">No credit or loan data found.</div>;
  }

  return (
    <div className="space-y-6">
      {user.loansGiven.length > 0 && (
        <SectionCard title={`Loans given (${user.loansGiven.length})`}>
          <div className="space-y-3">
            {user.loansGiven.map((loan) => (
              <LoanCard key={loan.id} loan={loan} perspective="lender" />
            ))}
          </div>
        </SectionCard>
      )}

      {user.loansTaken.length > 0 && (
        <SectionCard title={`Loans received (${user.loansTaken.length})`}>
          <div className="space-y-3">
            {user.loansTaken.map((loan) => (
              <LoanCard key={loan.id} loan={loan} perspective="borrower" />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function LoanCard({ loan, perspective }: { loan: Loan; perspective: 'lender' | 'borrower' }) {
  const [open, setOpen] = useState(false);
  const counterparty   = perspective === 'lender' ? loan.borrower : loan.lender;
  const usedPct =
    Number(loan.totalCredit) > 0
      ? (Number(loan.totalUsed) / Number(loan.totalCredit)) * 100
      : 0;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800">
              {perspective === 'lender' ? 'To: ' : 'From: '}
              <span className="text-gray-600">{counterparty?.name ?? counterparty?.email ?? 'Unknown'}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, usedPct)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                ${Number(loan.totalUsed).toFixed(2)} / ${Number(loan.totalCredit).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <span className="text-gray-300 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 bg-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            Credit offers ({loan.creditOffers.length})
          </p>
          {loan.creditOffers.length === 0 ? (
            <p className="text-xs text-gray-400">No offers yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-1.5 text-left font-medium">Amount</th>
                  <th className="py-1.5 text-left font-medium">Status</th>
                  <th className="py-1.5 text-left font-medium">Date</th>
                  <th className="py-1.5 text-left font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loan.creditOffers.map((offer) => {
                  const ob = creditOfferBadge[offer.status];
                  return (
                    <tr key={offer.id}>
                      <td className="py-2 font-bold text-[#2B6E44]">
                        ${Number(offer.amount).toFixed(2)}
                      </td>
                      <td className="py-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${ob.className}`}>
                          {ob.label}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-gray-400">
                        {new Date(offer.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-2 text-xs text-gray-400 italic">{offer.note ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

function InfoTable({
  rows,
}: {
  rows: { label: string; value: string; mono?: boolean }[];
}) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-gray-50">
        {rows.map(({ label, value, mono }) => (
          <tr key={label}>
            <td className="py-2 text-gray-400 text-xs w-40">{label}</td>
            <td className={`py-2 text-gray-700 ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}