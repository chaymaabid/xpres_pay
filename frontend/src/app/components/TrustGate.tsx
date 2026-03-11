'use client';
import { useTrust } from '@/context/TrustContext';
import React from 'react';

export default function TrustGate({ children, onVerifiedClick }: { children: React.ReactElement, onVerifiedClick: () => void }) {
  const { hasProfile, isDeviceTrusted, loading } = useTrust();

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (loading) return;

    if (!hasProfile || !isDeviceTrusted) {
      const type = !hasProfile ? 'NO_TRUSTED_PROFILE_DETECTED' : 'NEW_DEVICE_DETECTED';
      window.dispatchEvent(new CustomEvent('SECURITY_GATE_TRIGGERED', { detail: type }));
    } else {
      onVerifiedClick();
    }
  };

  return React.cloneElement(children, { onClick: handleAction });
}