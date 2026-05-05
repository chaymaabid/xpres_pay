'use client';
import { useEffect, useState, useMemo } from 'react';
import { acceptCredit, rejectCredit,FarmerCredit, FarmerCreditStats,} from '@/services/credits.service';
import { getFarmerCredits } from '@/services/credits.service';
type Tab = 'All Offers' | 'Accepted' | 'Rejected' | 'Cancelled';
const TABS: Tab[] = ['All Offers', 'Accepted', 'Rejected', 'Cancelled'];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'Pending',   className: 'bg-amber-50 text-amber-600 border border-amber-100' },
  ACCEPTED:  { label: 'Accepted',  className: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
  REJECTED:  { label: 'Rejected',  className: 'bg-red-50 text-red-500 border border-red-100' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-400 border border-gray-200' },
};

export default function FarmerCreditsPage() {
  const [credits, setCredits]   = useState<FarmerCredit[]>([]);
  const [stats, setStats]       = useState<FarmerCreditStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<Tab>('All Offers');
  const [search, setSearch]     = useState('');
  const [acting, setActing]     = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { credits: c, stats: s } = await getFarmerCredits();
      setCredits(c);
      setStats(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handle = async (creditId: string, action: 'accept' | 'reject') => {
    setActing({ id: creditId, action });
    try {
      if (action === 'accept') await acceptCredit(creditId);
      else await rejectCredit(creditId);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? `Failed to ${action} offer.`);
    } finally {
      setActing(null);
    }
  };

  const pending = credits.filter(c => c.status === 'PENDING');

  const historyFiltered = useMemo(() => {
    return credits
      .filter(c => {
        if (tab === 'All Offers') return true;
        return c.status === tab.toUpperCase();
      })
      .filter(c =>
        (c.lender?.name ?? c.lender?.email ?? '')
          .toLowerCase().includes(search.toLowerCase()),
      );
  }, [credits, tab, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* ── Page content ──────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Credit Offers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and accept secured credit offers from your marketplace partners.
          </p>
        </div>

        {/* ── Stats cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats && [
            { label: 'Total Offered',         value: stats.totalOffered,  sub: 'Retailers trust offer you' },
            { label: 'Total Pending Offers',  value: stats.totalPending,  sub: 'Amount if you accept all' },
            { label: 'Total Credits Accepted',value: stats.totalAccepted, sub: 'Lifetime credit volume' },
            { label: 'Total Rejected',        value: stats.totalRejected, sub: 'Lifetime credit volume' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">${Number(s.value).toLocaleString()}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Pending offers ───────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Pending Offers{' '}
              {pending.length > 0 && (
                <span className="ml-1.5 text-sm font-bold text-gray-400">{pending.length}</span>
              )}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[#2B6E44] font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Funds already secured by platform
            </div>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse"/>
              ))}
            </div>
          )}

          {!loading && pending.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-10 text-center">
              <p className="text-gray-400 text-sm">No pending credit offers right now.</p>
            </div>
          )}

          {!loading && pending.length > 0 && (
            <div className="space-y-3">
              {pending.map(credit => (
                <PendingOfferCard
                  key={credit.id}
                  credit={credit}
                  acting={acting}
                  onAccept={() => handle(credit.id, 'accept')}
                  onReject={() => handle(credit.id, 'reject')}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── History table ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs + search */}
          <div className="flex items-center justify-between px-5 pt-4 pb-0 border-b border-gray-100 flex-wrap gap-3">
            <div className="flex items-center gap-1">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-xs font-semibold rounded-t transition-colors whitespace-nowrap
                    ${tab === t
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400 mb-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search Retailer..."
                className="outline-none bg-transparent w-28 text-gray-700"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-50">
                  <th className="text-left px-5 py-3">Retailer</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">
                    Date Sent
                    <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
                    </svg>
                  </th>
                  <th className="text-left px-4 py-3">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && historyFiltered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                      No offers found.
                    </td>
                  </tr>
                )}
                {!loading && historyFiltered.map(credit => (
                  <tr key={credit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-800">
                      {credit.lender?.name ?? credit.lender?.email ?? '—'}
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-800">
                      ${Number(credit.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_MAP[credit.status].className}`}>
                        {STATUS_MAP[credit.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs">
                      {new Date(credit.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs">
                      {credit.respondedAt
                        ? timeSince(new Date(credit.respondedAt))
                        : timeSince(new Date(credit.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Showing {historyFiltered.length} of {credits.length} active offers.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Pending offer card ─────────────────────────────────────────────────────
function PendingOfferCard({
  credit, acting, onAccept, onReject,
}: {
  credit:   FarmerCredit;
  acting:   { id: string; action: string } | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  const isActing = acting?.id === credit.id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Left: retailer info */}
        <div className="flex-1 px-5 py-5 border-b sm:border-b-0 sm:border-r border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 text-base">
              {credit.lender?.name ?? credit.lender?.email ?? 'Retailer'}
            </p>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Retailer • {timeSince(new Date(credit.createdAt))}
          </p>
          {credit.note && (
            <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <p className="text-xs text-gray-600 italic">"{credit.note}"</p>
            </div>
          )}
        </div>

        {/* Right: amount + actions */}
        <div className="flex flex-col items-center justify-center px-6 py-5 gap-4 min-w-[180px]">
          <div className="text-center">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
              Credit Amount Offered
            </p>
            <p className="text-3xl font-bold text-gray-900">
              ${Number(credit.amount).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Accept */}
            <button
              onClick={onAccept}
              disabled={isActing}
              className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-40"
            >
              {isActing && acting?.action === 'accept' ? (
                <Spinner color="text-emerald-500" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              )}
              Accept
            </button>

            <span className="text-gray-200">|</span>

            {/* Reject */}
            <button
              onClick={onReject}
              disabled={isActing}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors disabled:opacity-40"
            >
              {isActing && acting?.action === 'reject' ? (
                <Spinner color="text-red-400" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              )}
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function Spinner({ color }: { color: string }) {
  return (
    <svg className={`w-4 h-4 animate-spin ${color}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

function timeSince(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)} day${Math.floor(s / 86400) > 1 ? 's' : ''} ago`;
}