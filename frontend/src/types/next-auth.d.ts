import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    idToken:string;
    role?: string;
    keycloakId?: string;
    error?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    idToken?:string;
    refreshToken?: string;
    accessTokenExpires?: number;
    expiresAt?: number;
    role?: string;
    keycloakId?: string;
    error?: string;
  }
}