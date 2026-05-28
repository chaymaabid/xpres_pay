'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { adminService, AdminUserSummary } from '@/services/users.service';

const ROLE_OPTIONS = ['All', 'FARMER', 'RETAILER'];

const roleBadge: Record<string, { label: string; className: string }> = {
  FARMER:   { label: 'Farmer',   className: 'bg-amber-50 text-amber-600 border border-amber-100' },
  RETAILER: { label: 'Retailer', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
  ADMIN:    { label: 'Admin',    className: 'bg-purple-50 text-purple-600 border border-purple-100' },
};

export default function AdminUsersPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const page   = parseInt(searchParams.get('page') || '1');
  const role   = searchParams.get('role') || '';
  const search = searchParams.get('search') || '';

  const [users, setUsers]             = useState<AdminUserSummary[]>([]);
  const [meta, setMeta]               = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading]         = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  // Track which userId is currently being toggled to show a spinner on that row
  const [togglingId, setTogglingId]   = useState<string | null>(null);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value); else params.delete(key);
      if (key !== 'page') params.set('page', '1');
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminService
      .getUsers({ page, role: role || undefined, search: search || undefined })
      .then(({ data, meta }) => { setUsers(data); setMeta(meta); })
      .finally(() => setLoading(false));
  }, [page, role, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput);
  };

  // Optimistic toggle: flip locally first, call API, revert on error
  const handleToggle = async (user: AdminUserSummary) => {
    const next = !user.isEnabled;
    setTogglingId(user.id);

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isEnabled: next } : u)),
    );

    try {
      await adminService.setUserEnabled(user.id, next);
    } catch {
      // Revert on failure
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isEnabled: !next } : u)),
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-6 pt-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-[#185c3d] transition-colors"
          >
            Search
          </button>
        </form>

        <select
          value={role}
          onChange={(e) => updateParam('role', e.target.value === 'All' ? '' : e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r === 'All' ? '' : r}>
              {r === 'All' ? 'Role: All' : r}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <span className="text-sm text-gray-500">{meta.total} Results</span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Orders</th>
                <th className="px-6 py-3 text-left">Trust score</th>
                <th className="px-6 py-3 text-left">Verified</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Joined</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => {
                const badge    = roleBadge[user.role];
                const toggling = togglingId === user.id;
                const initials = (user.name ?? user.email)
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      !user.isEnabled ? 'opacity-60' : ''
                    }`}
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{user.name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      {badge ? (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
                          {user.role}
                        </span>
                      )}
                    </td>

                    {/* Orders */}
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {user._count.ordersAsBuyer}
                    </td>

                    {/* Trust score */}
                    <td className="px-6 py-4">
                      {user.trustProfile ? (
                        <span
                          className={`font-bold text-sm ${
                            user.trustProfile.trustScore >= 7
                              ? 'text-[#2B6E44]'
                              : user.trustProfile.trustScore >= 4
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {user.trustProfile.trustScore.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Verified */}
                    <td className="px-6 py-4">
                      {user.trustProfile?.isVerified ? (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Enabled status */}
                    <td className="px-6 py-4">
                      {user.isEnabled ? (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#185c3d] transition-colors"
                        >
                          Details
                        </Link>

                        <button
                          onClick={() => handleToggle(user)}
                          disabled={toggling}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                            user.isEnabled
                              ? 'border-red-200 text-red-500 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {toggling ? (
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                              {user.isEnabled ? 'Disabling…' : 'Enabling…'}
                            </span>
                          ) : user.isEnabled ? (
                            'Disable'
                          ) : (
                            'Enable'
                          )}
                        </button>
                      </div>
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
                    className={`w-8 h-8 text-xs rounded-lg ${
                      p === page
                        ? 'bg-primary text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
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