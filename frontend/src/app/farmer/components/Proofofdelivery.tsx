// components/dashboard/ProofOfDeliverySection.tsx
'use client';

import { useState } from 'react';

/**
 * PROOF OF DELIVERY SECTION
 * 
 * Allows farmers to scan QR codes or upload documents
 * to prove delivery and release funds from escrow.
 * 
 * Features:
 * - QR code scanner
 * - Document upload
 * - Instant fund release after verification
 */

export default function ProofOfDeliverySection() {
  const [isScanning, setIsScanning] = useState(false);

  const handleScanNow = () => {
    setIsScanning(true);
    // In production, this would open camera/scanner
    console.log('Opening QR scanner...');
    alert('QR Scanner would open here. In production, integrate with a QR scanning library.');
  };

  const handleUploadDocument = () => {
    // In production, open file picker
    console.log('Opening file picker...');
    alert('File picker would open here for document upload.');
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 border border-green-100">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Side - Icon and Text */}
        <div className="flex-1">
          <div className="flex items-start gap-4">
            {/* QR Icon */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <QRCodeIcon />
            </div>

            {/* Text Content */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Scan Proof of Delivery
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Instantly release locked funds by scanning the QR code or signed manifest 
                provided by the retailer upon successful delivery.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleScanNow}
                  className="flex items-center gap-2 bg-[#2B6E44] hover:bg-[#1a4a2e] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <ScanIcon />
                  Scan Now
                </button>

                <button
                  onClick={handleUploadDocument}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-200 transition-colors"
                >
                  <UploadIcon />
                  Upload Document
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Phone Illustration */}
        <div className="flex-shrink-0">
          <PhoneIllustration />
        </div>
      </div>
    </div>
  );
}

// QR Code Icon
function QRCodeIcon() {
  return (
    <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );
}

// Scan Icon
function ScanIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

// Upload Icon
function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

// Phone Illustration (simplified)
function PhoneIllustration() {
  return (
    <div className="relative w-32 h-48 bg-gray-800 rounded-3xl p-2 shadow-xl">
      {/* Phone Screen */}
      <div className="w-full h-full bg-white rounded-2xl p-3 flex items-center justify-center">
        {/* QR Code inside phone */}
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded ${
                i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Phone notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-900 rounded-b-lg" />
    </div>
  );
}