import NextAuth, { AuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

function decodeJwt(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: '',          
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
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken=account.id_token;
        token.accessTokenExpires = account.expires_at! * 1000;

        const decoded = decodeJwt(account.access_token as string);
        const realmRoles: string[] = decoded?.roles ?? [];
        token.role = realmRoles.includes('FARMER')
          ? 'FARMER'
          : realmRoles.includes('RETAILER')
          ? 'RETAILER'
          : undefined;
        token.keycloakId = decoded.sub;
      }
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

     
      return refreshAccessToken(token);
      
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.idToken=token.idToken as string;
      session.role = token.role as string;
      session.keycloakId = token.keycloakId as string;
     if (token.expiresAt) {
    session.expires = new Date(token.expiresAt * 1000).toISOString();
  }
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
  },

  pages: {
    signIn: '/auth',
    error: '/auth',
  },

  session: { strategy: 'jwt', maxAge: 60 * 30 },
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
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        }),
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };