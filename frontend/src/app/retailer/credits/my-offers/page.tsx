// app/retailer/credits/my-offers/page.tsx
'use client';
import { useEffect, useState, useMemo } from 'react';
import { getMyOffers, cancelCredit, Credit, CreditStatus, RetailerStats } from '@/services/credits.service';

type Tab = 'All' | CreditStatus;
const TABS: Tab[] = ['All', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'];

const STATUS_STYLES: Record<CreditStatus, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-100',
  ACCEPTED:  'bg-emerald-50 text-emerald-700 border-emerald-100',
  REJECTED:  'bg-red-50 text-red-600 border-red-100',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function MyOffersPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [stats, setStats]     = useState<RetailerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>('All');
  const [search, setSearch]   = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { credits: c, stats: s } = await getMyOffers();
      setCredits(c);
      setStats(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (creditId: string) => {
    if (!confirm('Cancel this offer? A full refund will be issued to your card.')) return;
    setCancelling(creditId);
    try {
      await cancelCredit(creditId);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Cancel failed.');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = useMemo(() => credits.filter(c => {
    const matchTab    = tab === 'All' || c.status === tab;
    const matchSearch = (c.borrower?.name ?? c.borrower?.email ?? '')
      .toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  }), [credits, tab, search]);

  // Donut chart data for portfolio health
  const accepted  = credits.filter(c => c.status === 'ACCEPTED').length;
  const pending   = credits.filter(c => c.status === 'PENDING').length;
  const rejected  = credits.filter(c => c.status === 'REJECTED').length;
  const total     = accepted + pending + rejected || 1;
  const accPct    = (accepted / total) * 100;
  const penPct    = (pending  / total) * 100;

  return (
    <div className="p-8 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Credit Offers</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage and track your credits in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* ── Left: stats + table ───────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats && [
              { label: 'Total Reserved Funds', value: `$${stats.totalReserved.toLocaleString()}`, green: true },
              { label: 'Acceptance Rate',       value: `${stats.acceptanceRate}%` },
              { label: 'Active Farmers',         value: stats.activeFarmers },
              { label: 'Avg. Farmer Score',      value: `${stats.avgScore}/100` },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                <p className="text-[11px] text-gray-400 mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.green ? 'text-[#2B6E44]' : 'text-gray-900'}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100 overflow-x-auto">
              {TABS.map(t => (
                <button key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-colors
                    ${tab === t
                      ? 'text-[#2B6E44] border-b-2 border-[#2B6E44]'
                      : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t === 'All' ? 'All Offers' : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400 mb-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search farmers..."
                  className="outline-none bg-transparent w-28"/>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-50">
                    <th className="text-left px-5 py-3">Farmer & Trust</th>
                    <th className="text-left px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date Sent</th>
                    <th className="text-left px-4 py-3">Last Update</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Loading...</td></tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No offers found.</td></tr>
                  )}
                  {!loading && filtered.map(credit => (
                    <tr key={credit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-800">
                          {credit.borrower?.name ?? credit.borrower?.email ?? '—'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[11px] text-[#2B6E44] font-bold bg-[#e8f5ee] px-1.5 py-0.5 rounded-full">
                            {credit.borrower?.trustProfile?.score ?? '0 '} Trust Score
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">
                        ${Number(credit.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${STATUS_STYLES[credit.status]}`}>
                          {credit.status.charAt(0) + credit.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">
                        {new Date(credit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs">
                        {credit.respondedAt
                          ? timeSince(new Date(credit.respondedAt))
                          : timeSince(new Date(credit.createdAt))}
                      </td>
                      <td className="px-4 py-3.5">
                        {credit.status === 'PENDING' ? (
                          <button
                            onClick={() => handleCancel(credit.id)}
                            disabled={cancelling === credit.id}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40"
                          >
                            {cancelling === credit.id ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            )}
                            Cancel
                          </button>
                        ) : (
                          <button className="text-xs text-[#2B6E44] font-medium hover:underline flex items-center gap-1">
                      
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination placeholder */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Viewing {filtered.length} of {credits.length} active offers.
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Offer Status Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Performance metrics across all offers.</p>

          {/* Simple SVG donut chart */}
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 120 120" className="w-28 h-28">
              <DonutSegment pct={accPct} offset={0}    color="#2B6E44"/>
              <DonutSegment pct={penPct} offset={accPct} color="#d1fae5"/>
              <DonutSegment pct={100 - accPct - penPct} offset={accPct + penPct} color="#fee2e2"/>
              <circle cx="60" cy="60" r="30" fill="white"/>
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs mb-5">
            {[
              { label: 'Accepted', color: '#2B6E44' },
              { label: 'Pending',  color: '#d1fae5', border: true },
              { label: 'Rejected', color: '#fee2e2', border: true },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }}/>
                <span className="text-gray-600">{l.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function DonutSegment({ pct, offset, color }: { pct: number; offset: number; color: string }) {
  const r = 45; const c = 60;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  const rot   = (offset / 100) * 360 - 90;
  return (
    <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="18"
      strokeDasharray={`${dash} ${circ}`}
      transform={`rotate(${rot} ${c} ${c})`}/>
  );
}

function timeSince(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}