// app/farmer/escrow/ProofOfDeliveryModal.tsx
'use client';
import { useState, useCallback, useRef } from 'react';
import { uploadProofOfDelivery, releaseFunds } from '@/services/escrow.service';

type Step = 1 | 2 | 3;

type Props = {
  orderId: string;
  shortId: string;
  lockedAmount: number;
  onClose: () => void;
  onReleased: () => void;
};

export default function ProofOfDeliveryModal({
  orderId, shortId, lockedAmount, onClose, onReleased,
}: Props) {
  const [step, setStep]         = useState<Step>(1);
  const [file, setFile]         = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrFailed, setOcrFailed]   = useState(false);
  const [releaseSuccess, setReleaseSuccess] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prevent closing while processing
  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFile = useCallback(async (selected: File) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(selected.type)) {
      setError('Only PDF, JPG, and PNG files are supported.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB.');
      return;
    }
    setError(null);
    setFile(selected);
    setOcrFailed(false);
    // Auto-advance to step 2 and immediately trigger OCR
    setStep(2);
    await runOcr(selected);
  }, [orderId]);

  const runOcr = async (selectedFile: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await uploadProofOfDelivery(orderId, selectedFile);
      if (result.matched) {
        setStep(3);
        await runRelease();
      } else {
        setOcrFailed(true);
      }
    } catch {
      setError('Failed to reach verification service. Please try again.');
      setOcrFailed(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const runRelease = async () => {
    setIsProcessing(true);
    try {
      await releaseFunds(orderId);
      setReleaseSuccess(true);
      onReleased();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Fund release failed. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Drag and drop handlers ─────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const stepDone  = (s: Step) => s < step;
  const stepActive = (s: Step) => s === step;

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Release Escrow Funds</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Upload proof of delivery to verify order and release payment.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400 font-mono">
                Order #{shortId}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-amber-600">
                ${lockedAmount.toFixed(2)} locked in escrow
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-1"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Progress timeline ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-10 py-5">
          {(['Upload POD', 'Verify Order ID', 'Release Funds'] as const).map((label, idx) => {
            const s = (idx + 1) as Step;
            const done   = stepDone(s);
            const active = stepActive(s);
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500
                    ${done   ? 'bg-[#2B6E44] text-white' :
                      active ? 'bg-[#2B6E44] text-white ring-4 ring-[#2B6E44]/20' :
                               'bg-white border-2 border-gray-200 text-gray-400'}
                  `}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : active && isProcessing ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-[11px] font-medium whitespace-nowrap ${active ? 'text-[#2B6E44]' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {/* Animated connector */}
                {idx < 2 && (
                  <div className="flex-1 h-0.5 mx-2 mb-5 bg-gray-200 relative overflow-hidden">
                    <div className={`
                      absolute inset-0 bg-[#2B6E44] transition-transform duration-700 ease-in-out origin-left
                      ${done ? 'scale-x-100' : 'scale-x-0'}
                    `}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step content ────────────────────────────────────────────────── */}
        <div className="px-6 pb-2">

          {/* STEP 1 — Upload zone */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
                  ${isDragging ? 'border-[#2B6E44] bg-[#e8f5ee]' : 'border-gray-200 hover:border-[#2B6E44] hover:bg-gray-50'}
                `}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <p className="font-semibold text-gray-800 text-sm">Drag & drop file here</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG supported (Max 10MB)</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </div>

              {error && <ErrorBanner message={error} />}

              <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-xs text-gray-500">
                  Please ensure the{' '}
                  <span className="font-bold text-gray-700">Order ID (#{shortId})</span>
                  {' '}is clearly visible in the document to avoid verification delays.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 — OCR verification */}
          {step === 2 && (
            <div className="py-6 space-y-4">
              {isProcessing && !ocrFailed && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100"/>
                    <div className="absolute inset-0 rounded-full border-4 border-[#2B6E44] border-t-transparent animate-spin"/>
                    <div className="absolute inset-2 rounded-full bg-[#e8f5ee] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-800 text-sm">Checking document with OCR...</p>
                    <p className="text-xs text-gray-400 mt-1">Searching for Order ID #{shortId}</p>
                  </div>
                </div>
              )}

              {ocrFailed && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Order ID does not match this escrow</p>
                      <p className="text-xs text-red-500 mt-1">
                        Please upload the correct proof of delivery containing Order ID #{shortId}.
                      </p>
                    </div>
                  </div>

                  {error && <ErrorBanner message={error} />}

                  <button
                    onClick={() => { setStep(1); setOcrFailed(false); setFile(null); setError(null); }}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    Upload a Different Document
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Release funds */}
          {step === 3 && (
            <div className="py-6 space-y-4">
              {isProcessing && !releaseSuccess && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100"/>
                    <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"/>
                    <div className="absolute inset-2 rounded-full bg-amber-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-800 text-sm">Releasing funds securely...</p>
                    <p className="text-xs text-gray-400 mt-1">Initiating Stripe transfer to your account</p>
                  </div>
                </div>
              )}

              {releaseSuccess && (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  {/* Animated success circle */}
                  <div className="w-20 h-20 bg-[#e8f5ee] rounded-full flex items-center justify-center animate-bounce-once">
                    <svg className="w-10 h-10 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">Funds released successfully.</p>
                    <p className="text-sm text-[#2B6E44] font-semibold mt-1">
                      ${lockedAmount.toFixed(2)} transferred to your Stripe account.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Funds typically arrive within 1–2 business days.
                    </p>
                  </div>
                </div>
              )}

              {error && <ErrorBanner message={error} />}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          SECURE ESCROW VERIFICATION POWERED BY AI
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
      <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}