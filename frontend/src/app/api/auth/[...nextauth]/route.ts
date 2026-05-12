import NextAuth, { AuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

function decodeJwt(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

/**
 * How long before expiry we proactively refresh (60 seconds buffer).
 * This prevents sending a token that expires mid-request.
 */
const REFRESH_BUFFER_MS = 60 * 1000;

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET ?? '', // use env var, even if public client
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // ── 1. Initial sign-in: hydrate token from Keycloak account ──────────
      if (account) {
        const decoded = decodeJwt(account.access_token as string);
        const realmRoles: string[] = decoded?.realm_access?.roles ?? decoded?.roles ?? [];

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          // Use the actual exp from the JWT, not account.expires_at (can differ)
          accessTokenExpires: decoded.exp ? decoded.exp * 1000 : account.expires_at! * 1000,
          role: realmRoles.includes('FARMER')
            ? 'FARMER'
            : realmRoles.includes('RETAILER')
            ? 'RETAILER'
            :realmRoles.includes('ADMIN')
            ?'ADMIN'
            : undefined,
          keycloakId: decoded.sub,
          error: undefined, // clear any previous error on fresh login
        };
      }

      // ── 2. Token still valid → return as-is ──────────────────────────────
      const expiresAt = token.accessTokenExpires as number;
      if (Date.now() < expiresAt - REFRESH_BUFFER_MS) {
        return token;
      }

      // ── 3. Token expired (or about to) → refresh ─────────────────────────
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      // Propagate refresh errors to the client so it can trigger re-login
      if (token.error) {
        session.error = token.error as string;
      }

      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;
      session.role = token.role as string;
      session.keycloakId = token.keycloakId as string;
      // Keep session.expires as the NextAuth session expiry (set by maxAge),
      // do NOT override it with accessTokenExpires
      if (session.user) session.user.role = token.role as string;

      return session;
    },
  },

  events: {
    async signIn({ account }) {
      if (!account?.access_token) return;
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${account.access_token}` },
        });
      } catch (e) {
        console.error('[NextAuth] Backend sync failed:', e);
      }
    },

    // ── Keycloak back-channel logout / session expiry cleanup ────────────
    async signOut({ token }: any) {
      // Revoke the Keycloak session when the user signs out from NextAuth
      if (!token?.idToken) return;
      try {
        const logoutUrl =
          `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout` +
          `?id_token_hint=${token.idToken}` +
          `&post_logout_redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL!)}`;
        await fetch(logoutUrl);
      } catch (e) {
        console.error('[NextAuth] Keycloak logout failed:', e);
      }
    },
  },

  pages: {
    signIn: '/auth',
    error: '/auth',
  },

  session: {
    strategy: 'jwt',
    maxAge: 60 * 30, // 30 min — must be >= Keycloak refresh_token TTL or users re-login often
  },

  debug: process.env.NODE_ENV === 'development',
};

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_ID!,
          // Required for confidential clients; harmless empty string for public clients
          ...(process.env.KEYCLOAK_SECRET ? { client_secret: process.env.KEYCLOAK_SECRET } : {}),
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        }),
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('[NextAuth] Token refresh failed:', refreshedTokens);
      throw refreshedTokens;
    }

    // Re-decode the new access token to keep role/keycloakId in sync
    const decoded = decodeJwt(refreshedTokens.access_token);
    const realmRoles: string[] = decoded?.realm_access?.roles ?? decoded?.roles ?? [];

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      // Keycloak may or may not rotate the refresh token
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      // id_token is returned on refresh when openid scope is active
      idToken: refreshedTokens.id_token ?? token.idToken,
      accessTokenExpires: decoded.exp
        ? decoded.exp * 1000
        : Date.now() + refreshedTokens.expires_in * 1000,
      role: realmRoles.includes('FARMER')
        ? 'FARMER'
        : realmRoles.includes('RETAILER')
        ? 'RETAILER'
        :realmRoles.includes('ADMIN')
        ?'ADMIN'
        : undefined,
      keycloakId: decoded.sub,
      error: undefined, // clear error on successful refresh
    };
  } catch (error) {
    console.error('[NextAuth] Error refreshing access token:', error);
    // Signal to the session callback — client must re-authenticate
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };