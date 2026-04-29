'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { authApi } from '@/lib/authApi';

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  url: string | null;
  isRead: boolean;
  readedAt: string | null;
  createdAt: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  loading: boolean;
  toggleOpen: () => void;
  markAllRead: () => Promise<void>;
  refetchCount: () => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === 'authenticated' && !!session;

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await authApi.get('api/v1/notifications/unread-count');
      setUnreadCount(data.count);
    } catch {
      // badge just stays at 0
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await authApi.get('api/v1/notifications');
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchUnreadCount();
    else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = async () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) await fetchNotifications();
  };

  const markAllRead = async () => {
    if (!isAuthenticated) return;
    try {
      await authApi.patch('api/v1/notifications/read');
      setUnreadCount(0);
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readedAt: new Date().toISOString() }))
      );
    } catch {
      // silently fail
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isOpen,
      loading,
      toggleOpen,
      markAllRead,
      refetchCount: fetchUnreadCount,
    }}>
      {/* Pass the ref so the dropdown can register outside clicks */}
      <NotificationDropdownRefContext.Provider value={dropdownRef}>
        {children}
      </NotificationDropdownRefContext.Provider>
    </NotificationContext.Provider>
  );
}

// Separate ref context so NavBar can attach it to its dropdown div
export const NotificationDropdownRefContext = createContext<React.RefObject<HTMLDivElement> | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};

export const useNotificationDropdownRef = () => useContext(NotificationDropdownRefContext);