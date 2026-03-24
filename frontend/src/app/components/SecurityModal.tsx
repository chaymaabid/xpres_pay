'use client';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react'; 
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function SecurityModal() {
  const { data: session, status: authStatus } = useSession(); 
  const [isVisible, setIsVisible] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [kycSession, setKycSession] = useState<any>(null);
  const [socketStatus, setSocketStatus] = useState('WAITING');

  // Listen for the Trigger Event
  useEffect(() => {
    const handler = (e: any) => {
      setErrorType(e.detail);
      setIsVisible(true);
    };
    window.addEventListener('SECURITY_GATE_TRIGGERED', handler);
    return () => window.removeEventListener('SECURITY_GATE_TRIGGERED', handler);
  }, []);

  //  Initialize KYC 
  useEffect(() => {
    // Stop if modal not ready OR user not authenticated OR session already created
    if (!isVisible || authStatus !== 'authenticated' || !session || kycSession) return;
    const startKyc = async () => {
    try {
      const mode = errorType === 'NO_TRUSTED_PROFILE_DETECTED' ? 'FULL' : 'REAUTH';
      console.log("Initializing KYC Session..."); 
       const fp = await FingerprintJS.load();
      const result = await fp.get();
    
      const res = await fetch('https://p60m3x78-3001.euw.devtunnels.ms/api/v1/kyc/init', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}` ,
          'x-device-fingerprint': result.visitorId
        },
        body: JSON.stringify({ 
          userKeycloackId: session.keycloakId, 
          mode 
        })
      });

      if (!res.ok) throw new Error("Failed to init");
      
      const data = await res.json();
      setKycSession(data); 

      const socket = io('https://p60m3x78-3001.euw.devtunnels.ms');
      socket.emit('join-kyc-room', data.id);

      socket.on('KYC_PROGRESS', (update) => {
        setSocketStatus(update.status);
        if (update.status === 'SUCCESS') {
          setTimeout(() => window.location.reload(), 2000);
        }
      });

    } catch (err) {
      console.error("KYC Error:", err);
    }
  };

  startKyc();
  }, [isVisible, authStatus, session?.accessToken, errorType, kycSession]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border-t-8 border-green-600">
        <h2 className="text-2xl font-bold text-red-600">Identity Check</h2>
        <p className="mt-2 text-gray-500 text-sm">
          {errorType === 'NO_TRUSTED_PROFILE_DETECTED' 
            ? "XpresPay requires a full KYC before your first transaction." 
            : "New device detected: Please verify your identity for this session."}
        </p>

        <div className="mt-6 p-4 bg-white border-2 border-gray-100 rounded-2xl inline-block shadow-inner">
          {kycSession?.id ? (
            <QRCodeSVG 
              value={`https://p60m3x78-3000.euw.devtunnels.ms/verify/${kycSession.id}?mode=${kycSession.mode}`} 
              size={180} 
            />
          ) : (
            <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] text-gray-400">Generating Secure Session...</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`h-2 w-2 rounded-full ${socketStatus === 'SUCCESS' ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`}></div>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                Network: {socketStatus}
            </span>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="mt-8 text-gray-400 text-xs hover:text-green-600 transition-colors">
          Cancel & Close
        </button>
      </div>
    </div>
  );
}