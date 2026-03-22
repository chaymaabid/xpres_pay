import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { getSession } from 'next-auth/react'; 

const verifiedApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

verifiedApi.interceptors.request.use(async (config) => {
  
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  config.headers['x-device-fingerprint'] = result.visitorId;

  const session = await getSession(); 
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

verifiedApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Network Error: Server unreachable");
      return Promise.reject(error);
    }
    
    const status = error.response.status;
    const message = error.response.data?.message;
    //403 Forbidden error
    if (status === 403 && (message === 'NEW_DEVICE_DETECTED' || message === 'NO_TRUSTED_PROFILE_DETECTED')) {
      window.dispatchEvent(new CustomEvent('SECURITY_GATE_TRIGGERED', { detail: message }));
    }

    return Promise.reject(error);
  }
);


export default verifiedApi;