'use client';
import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Watches for a RefreshAccessTokenError in the session and forces
 * re-login so the user never gets stuck with an expired token.
 */
function TokenErrorWatcher() {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      console.warn('[Auth] Refresh token expired — forcing re-login');
      signOut({ callbackUrl: '/auth' });
    }
  }, [session]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Re-fetch session every 4 minutes (well within 5 min access token TTL)
      // so the jwt callback has a chance to refresh before the token is actually used
      refetchInterval={4 * 60}
      refetchOnWindowFocus={true}
    >
      <TokenErrorWatcher />
      {children}
    </SessionProvider>
  );
}