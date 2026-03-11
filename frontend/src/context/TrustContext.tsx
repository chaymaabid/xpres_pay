'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import verifiedApi from '@/lib/api';

const TrustContext = createContext({ hasProfile: false, isDeviceTrusted: false, loading: true, refresh: () => {} });

export function TrustProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [state, setState] = useState({ hasProfile: false, isDeviceTrusted: false, loading: true });

  const fetchStatus = async () => {
    
    if (status === 'loading') {
        return;
    }

    if (status !== 'authenticated') {
      setState({ hasProfile: false, isDeviceTrusted: false, loading: false });
      return;
    }

    try {
      
      const { data } = await verifiedApi.get('/api/v1/users/trust-status');
      
      setState({ 
        hasProfile: data.hasProfile, 
        isDeviceTrusted: data.isDeviceTrusted, 
        loading: false 
      });
    } catch (error) {
      setState(s => ({ ...s, loading: false }));
    }
  };

  
  useEffect(() => {
    fetchStatus();
  }, [status]); 

  return (
    <TrustContext.Provider value={{ ...state, refresh: fetchStatus }}>
      {children}
    </TrustContext.Provider>
  );
}

export const useTrust = () => useContext(TrustContext);