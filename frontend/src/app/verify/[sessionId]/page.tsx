'use client';

/**
 * verify/[sessionId]/page.tsx  (final version)
 * ---------------------------------------------
 * Mobile now only ever talks to NestJS.
 * FastAPI is completely invisible to the frontend.
 *
 * Key change vs the intermediate version:
 *   captureAndVerifyCin / captureAndVerifyFace both send to NestJS /kyc/step
 *   and read { success, detail } from the response.
 *   If success=false  → MismatchPopup with detail message
 *   If success=true   → advance step
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const NEST_API = 'https://p60m3x78-3001.euw.devtunnels.ms/api/v1/kyc';

type Step = 1 | 2 | 3 | 4;
interface FormData { fullName: string; idNumber: string }

function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const score = [
    navigator.maxTouchPoints > 1,
    window.screen.width <= 768,
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches,
    typeof window.orientation !== 'undefined' || 'onorientationchange' in window,
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent),
  ].filter(Boolean).length;
  return score >= 3;
}

function snapFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')!.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.85);
}
function stopStream(video: HTMLVideoElement) {
  (video.srcObject as MediaStream | null)?.getTracks().forEach(t => t.stop());
  video.srcObject = null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DesktopBlocker() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto mb-8 w-24 h-24 relative">
          <div className="w-full h-full rounded-3xl border-4 border-green-400 flex items-center justify-center shadow-2xl shadow-green-900">
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-green-400" stroke="currentColor" strokeWidth={1.5}>
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-3xl border-2 border-green-400 animate-ping opacity-20" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-3">Mobile Verification Required</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">Scan the QR code using your mobile device.</p>
        <div className="bg-slate-200/60 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
          {['Open your phone camera', 'Scan the QR code on screen', 'Complete verification on mobile'].map((text, i) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl">{i + 1}</span>
              <span className="text-slate-700 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const labels = ['Personal Info', 'Scan ID', 'Face Check'];
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {labels.map((label, i) => (
          <span key={label} className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
            step > i + 1 ? 'text-green-600' : step === i + 1 ? 'text-green-700' : 'text-slate-300'}`}>
            {label}
          </span>
        ))}
      </div>
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-green-500 to-green-700 transition-all duration-700 ease-out"
          style={{ width: `${Math.min((step - 1) / 3, 1) * 100}%` }} />
      </div>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="w-14 h-14 border-4 border-green-700 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-green-800 font-bold text-sm animate-pulse">Processing Securely…</p>
    </div>
  );
}

function MismatchPopup({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border-t-4 border-red-500">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✗</div>
        <h2 className="text-lg font-black text-slate-800 mb-2">Verification Failed</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">{message}</p>
        <button onClick={onRetry}
          className="w-full py-3 bg-green-700 text-white rounded-xl font-bold active:scale-[0.98] transition-all">
          Try Again
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MobileKYCPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const sessionId    = params.sessionId as string;
  const isReauth     = searchParams.get('mode') === 'REAUTH';

  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [step,     setStep]     = useState<Step>(isReauth ? 3 : 1);
  const [loading,  setLoading]  = useState(false);
  const [form,     setForm]     = useState<FormData>({ fullName: '', idNumber: '' });
  const [camErr,   setCamErr]   = useState<string | null>(null);
  const [camOn,    setCamOn]    = useState(false);
  const [mismatch, setMismatch] = useState<string | null>(null);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setIsMobile(isMobileDevice()); }, []);
  useEffect(() => {
    if (videoRef.current) stopStream(videoRef.current);
    setCamOn(false); setCamErr(null);
  }, [step]);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setCamErr(null);
    if (!navigator.mediaDevices?.getUserMedia) { setCamErr('Camera API not available.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false });
      if (videoRef.current) { videoRef.current.srcObject = stream; setCamOn(true); }
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : '';
      setCamErr(name === 'NotAllowedError' ? 'Camera permission denied.' : name === 'NotFoundError' ? 'No camera found.' : 'Could not start camera.');
    }
  }, []);

  /**
   * Single generic step submitter.
   * Sends to NestJS and reads { success, detail }.
   * Returns true if success, false if failed (and shows popup).
   */
  const submitStep = useCallback(async (stepNum: number, data: Record<string, unknown>): Promise<boolean> => {
    if (!sessionId) { alert('Session ID missing — please re-scan the QR code.'); return false; }
    setLoading(true);
    const kycmode=isReauth?"REAUTH":"FULL";
    try {
      const res = await fetch(`${NEST_API}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, step: stepNum, kycmode , data }),
      });
      const json = await res.json();

      if (!res.ok || json.success === false) {
        // NestJS returned a verification failure — show popup, stay on step
        setMismatch(json.detail ?? json.message ?? 'Verification failed. Please try again.');
        return false;
      }
      return true;
    } catch (err) {
      alert('Network error: ' + (err instanceof Error ? err.message : String(err)));
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Step 1 — just form data, always passes
  const submitStep1 = useCallback(async () => {
    const ok = await submitStep(1,{ ...form });
    if (ok) setStep(2);
  }, [form, submitStep]);

  // Step 2 — NestJS will call FastAPI OCR internally
  const captureAndVerifyCin = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const cinImage = snapFrame(videoRef.current, canvasRef.current);
    stopStream(videoRef.current); setCamOn(false);
    // Send cinImage + step-1 form data so NestJS can compare
    const ok = await submitStep(2, { cinImage, fullName: form.fullName, idNumber: form.idNumber });
    if (ok) setStep(3);
  }, [form, submitStep]);

  // Step 3 — NestJS fetches cinImage from DB and calls FastAPI face match
  const captureAndVerifyFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const faceImage = snapFrame(videoRef.current, canvasRef.current);
    stopStream(videoRef.current); setCamOn(false);
    // Only send faceImage — NestJS already has cinImage stored in the session
    const ok = await submitStep(3, { faceImage });
    if (ok) setStep(4);
  }, [submitStep]);

  const handleRetry = useCallback(() => setMismatch(null), []);

  if (isMobile === null) return null;
  if (!isMobile) return <DesktopBlocker />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <div className="h-1 bg-gradient-to-r from-green-400 via-green-600 to-emerald-500" />

      <div className="flex-1 p-6 max-w-md mx-auto w-full flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z"/>
            </svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-green-800">Identity Verification</span>
        </div>

        <ProgressBar step={step} />

        <div className="flex-1">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Personal Info</h1>
              <p className="text-slate-500 text-sm mt-1 mb-8">Enter your details exactly as they appear on your national ID.</p>
              <div className="space-y-4">
                {([
                  { key: 'fullName' as const, label: 'Full Name',       placeholder: 'John Doe' },
                  { key: 'idNumber' as const, label: 'CIN / ID Number', placeholder: '01234567' },
                ]).map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{label}</label>
                    <input type="text" placeholder={placeholder} value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-green-500 outline-none transition-colors text-base shadow-sm" />
                  </div>
                ))}
                <div className="pt-2">
                  <button onClick={submitStep1} disabled={!form.fullName.trim() || !form.idNumber.trim()}
                    className="w-full py-4 bg-green-700 text-white rounded-xl font-bold text-base shadow-lg disabled:opacity-40 active:scale-[0.98] transition-all">
                    Continue →
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 pt-2">🔒 Your data is encrypted and secure</p>
              </div>
            </div>
          )}

          {/* ── Steps 2 & 3: Camera ── */}
          <div className={step === 2 || step === 3 ? 'block' : 'hidden'}>
            <div className="flex flex-col items-center">
              {step === 2 && (
                <div className="w-full mb-6">
                  <h1 className="text-2xl font-black text-slate-800">Scan Your ID</h1>
                  <p className="text-slate-500 text-sm mt-1">Place your national ID card within the frame and tap <strong>Capture</strong>.</p>
                </div>
              )}
              {step === 3 && (
                <div className="w-full mb-6">
                  <h1 className="text-2xl font-black text-slate-800">Face Verification</h1>
                  <p className="text-slate-500 text-sm mt-1">Center your face in the circle and tap <strong>Verify</strong>.</p>
                </div>
              )}

              <div className={`relative bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-500
                ${step === 3 ? 'w-64 h-64 rounded-full border-[6px] border-green-300' : 'w-full aspect-[3/2] rounded-2xl border-4 border-white'}`}>
                <span className={`absolute text-6xl pointer-events-none transition-opacity duration-300 ${camOn ? 'opacity-0' : 'opacity-10'}`}>
                  {step === 3 ? '👤' : '🪪'}
                </span>
                <video ref={videoRef} autoPlay playsInline muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${step === 3 ? 'scale-x-[-1]' : ''} ${camOn ? 'opacity-100' : 'opacity-0'}`} />
                {step === 2 && <div className="absolute inset-8 border-2 border-dashed border-green-400 rounded-lg pointer-events-none" />}
                {camOn && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />LIVE
                  </div>
                )}
              </div>

              {camErr && (
                <div className="mt-4 w-full bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm text-center">{camErr}</p>
                </div>
              )}

              <div className="w-full mt-6 space-y-3">
                {!camOn ? (
                  <button onClick={() => startCamera(step === 3 ? 'user' : 'environment')}
                    className="w-full py-4 bg-green-700 text-white rounded-xl font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-green-200">
                    {step === 3 ? 'Open Front Camera' : 'Open Camera'}
                  </button>
                ) : (
                  <button onClick={step === 2 ? captureAndVerifyCin : captureAndVerifyFace}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-blue-200">
                    {step === 3 ? '✓ Verify My Face' : '✓ Capture & Verify'}
                  </button>
                )}
                {camOn && (
                  <button onClick={() => { if (videoRef.current) stopStream(videoRef.current); setCamOn(false); }}
                    className="w-full py-3 text-slate-400 text-sm font-medium">Retake</button>
                )}
              </div>
            </div>
          </div>

          {/* ── Step 4: Success ── */}
          {step === 4 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg shadow-green-100">✓</div>
              <h1 className="text-3xl font-black text-slate-800">All Done!</h1>
              <p className="text-slate-500 mt-3 px-4 text-sm leading-relaxed">
                Your identity has been successfully verified. Your desktop session will update automatically.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-700 text-xs font-bold uppercase tracking-wider">Verification Complete</span>
              </div>
              <p className="text-xs text-slate-300 mt-10 uppercase font-bold tracking-widest">Safe to close this tab</p>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden />
      {loading && <LoadingOverlay />}
      {mismatch && <MismatchPopup message={mismatch} onRetry={handleRetry} />}
    </div>
  );
}