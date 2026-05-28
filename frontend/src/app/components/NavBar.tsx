'use client';
import React, { useState, useRef, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TrustGate from './TrustGate';
import { useCartContext } from '@/context/CartContext';
import NotificationBell from './NotificationBell';

function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  let hoverTimeout: NodeJS.Timeout;

  const {totalItems, toggleCart, hydrated}= useCartContext();
  const isRetailer=session?.user?.role=="RETAILER";

  const handleLogin = () => {
    console.log(document.cookie);
    signIn('keycloak', {
      callbackUrl: '/',
    });
  };

  const handleLogout = async () => {
  if (!session) return; // Guard clause - exit if no session
  
  try {
    const keycloakLogoutUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/logout`;
    
    const logoutParams = new URLSearchParams({
      post_logout_redirect_uri: window.location.origin + '/auth',
      id_token_hint: session.idToken, // Now TypeScript knows session exists
    });

    const fullLogoutUrl = `${keycloakLogoutUrl}?${logoutParams.toString()}`;

    // Sign out from NextAuth (clears cookie)
    await signOut({ redirect: false });

    // Redirect to Keycloak to end SSO session
    window.location.href = fullLogoutUrl;
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback: just do NextAuth signout
    await signOut({ callbackUrl: '/auth' });
  }
  
  setIsDropdownOpen(false);
};

  const handleHomeClick = () => {
    if (!isHovering) {
      router.push('/');
    }
  };

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout);
    setIsHovering(true);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => {
      setIsHovering(false);
      setIsDropdownOpen(false);
    }, 300); // 300ms delay to allow moving to dropdown
  };

  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsHovering(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show loading state if session is loading
  if (status === 'loading') {
    return (
      <header className=" fixed z-30 w-full border-b border-gray-100 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2B6E44] rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"
                fill="white"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-lg">Xprespay</span>
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
      </header>
    );
  }

  return (
    <header className="fixed z-30 w-full border-b border-gray-100 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#2B6E44] rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"
              fill="white"/>
          </svg>
        </div>
        <span className="font-semibold text-gray-900 text-lg">Xprespay</span>
      </div>

      <div className="flex items-center gap-3">
      
        <NotificationBell/>
        
        <TrustGate onVerifiedClick={() => {}}>
        <button className="relative p-2 rounded-full hover:bg-gray-50">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        </TrustGate>
        {isRetailer && (
          <button
            onClick={toggleCart}
            className="relative p-2 rounded-full hover:bg-gray-50 transition-colors"
            aria-label="Open cart"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 10 19h9v-2h-8.42a.25.25 0 0 1-.22-.37L11.1 14h5.45a2 2 0 0 0 1.8-1.11l3.58-6.49A1 1 0 0 0 21 5H6.21l-.94-2zM7 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
            </svg>
            {/* Badge — shows total item count */}
            {hydrated && totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#2B6E44] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        )}

        {session ? (
          <div 
            className="relative"
            ref={menuRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Button that changes based on hover state */}
            <button
              onClick={handleHomeClick}
              className={`
                p-2 rounded-full transition-all duration-200
                
              `}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
            
            </button>

            {/* Dropdown menu - appears on hover */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <div className="font-medium truncate">{session.user?.email}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Role: {session.user?.role || 'User'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}

export default NavBar;