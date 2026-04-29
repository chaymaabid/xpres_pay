'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useNotifications, useNotificationDropdownRef } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const ICON_MAP: Record<string, React.ReactNode> = {
  ORDER_CREATED: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
    </svg>
  ),
  ORDER_STATUS_CHANGED: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
    </svg>
  ),
  PAYMENT_RECEIVED: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  ESCROW_LOCKED: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
  ),
  ESCROW_RELEASED: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
    </svg>
  ),
  DEFAULT: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
    </svg>
  ),
};

const TYPE_COLOR: Record<string, string> = {
  ORDER_CREATED:        'bg-blue-50 text-blue-600',
  ORDER_STATUS_CHANGED: 'bg-amber-50 text-amber-600',
  PAYMENT_RECEIVED:     'bg-green-50 text-green-600',
  ESCROW_LOCKED:        'bg-purple-50 text-purple-600',
  ESCROW_RELEASED:      'bg-teal-50 text-teal-600',
  DEFAULT:              'bg-gray-50 text-gray-600',
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const { notifications, unreadCount, isOpen, loading, toggleOpen, markAllRead } = useNotifications();
  const dropdownRef = useNotificationDropdownRef();

  // Don't render anything if not logged in
  if (!session) return null;

  const handleBellClick = async () => {
    await toggleOpen();
    if (!isOpen && unreadCount > 0) {
      // mark as read after opening
      await markAllRead();
    }
  };

  const handleNotifClick = (url: string | null) => {
    if (url) router.push(url);
    toggleOpen(); // close dropdown
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-gray-50 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-sm text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-400">{unreadCount} unread</span>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-6 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-full shrink-0"/>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4"/>
                    <div className="h-2 bg-gray-100 rounded w-full"/>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
              </div>
              <p className="text-sm text-gray-400">You're all caught up</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
              {notifications.map(n => {
                const icon = ICON_MAP[n.type] ?? ICON_MAP.DEFAULT;
                const color = TYPE_COLOR[n.type] ?? TYPE_COLOR.DEFAULT;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n.url)}
                    className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-green-50/40' : ''}`}
                  >
                    {/* Icon bubble */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium text-gray-800 leading-tight ${!n.isRead ? 'font-semibold' : ''}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-[#2B6E44] rounded-full shrink-0 mt-1"/>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}