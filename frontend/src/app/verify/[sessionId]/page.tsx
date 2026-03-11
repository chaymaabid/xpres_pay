'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const API_BASE = 'https://p60m3x78-3001.euw.devtunnels.ms/api/v1/kyc';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  fullName: string;
  idNumber: string;
  [key: string]: unknown;
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  // 1. Touch — real phones always have touch points > 1
  const hasTouch = navigator.maxTouchPoints > 1;

  // 2. Physical screen width — window.screen.width is the hardware resolution,
  //    NOT the browser viewport, so resizing a desktop window doesn't fool it
  const isNarrowScreen = window.screen.width <= 768;

  // 3. Pointer type — fingers = coarse, mouse = fine
  const hasCoarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

  // 4. Orientation API — present on mobile, absent on most desktops
  const hasOrientation =
    typeof window.orientation !== 'undefined' || 'onorientationchange' in window;

  // 5. UA string — weakest signal, easy to spoof, used only as a tiebreaker
  const mobileUA = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Must satisfy at least 3 of 5 signals — much harder to accidentally pass on desktop
  const score = [hasTouch, isNarrowScreen, hasCoarsePointer, hasOrientation, mobileUA]
    .filter(Boolean).length;

  return score >= 3;
}
function DesktopBlocker() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-sm w-full text-center">
        {/* Phone icon */}
        <div className="mx-auto mb-8 w-24 h-24 relative">
          <div className="w-full h-full rounded-3xl border-4 border-green-400 flex items-center justify-center bg-slate-60 shadow-2xl shadow-green-900">
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-green-400" stroke="currentColor" strokeWidth={1.5}>
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>
          {/* pulse ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-green-400 animate-ping opacity-20" />
        </div>

        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
          Mobile Verification Required
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          For security reasons, identity verification must be completed on a smartphone.
          Please scan the QR code again using your mobile device.
        </p>

        {/* Visual hint */}
        <div className="bg-slate-200/60 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
          {[
            { icon: '1', text: 'Open your phone camera' },
            { icon: '2', text: 'Scan the QR code on screen' },
            { icon: '3', text: 'Complete verification on mobile' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span className="text-slate-700 text-sm">{text}</span>
            </div>
          ))}
        </div>

        <p className="text-slate-600 text-xs mt-8 uppercase tracking-widest font-bold">
          This page is safe to close
        </p>
      </div>
    </div>
  );
}

//  Helpers 
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

function ProgressBar({ step }: { step: Step }) {
  const labels = ['Personal Info', 'Scan ID', 'Face Check'];
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {labels.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
              step > i + 1 ? 'text-green-600' : step === i + 1 ? 'text-green-700' : 'text-slate-300'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-700 transition-all duration-700 ease-out"
          style={{ width: `${Math.min((step - 1) / 3, 1) * 100}%` }}
        />
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

export default function MobileKYCPage() {
  const params       = useParams();
  const searchParams = useSearchParams();

  const sessionId = params.sessionId as string;
  const isReauth  = searchParams.get('mode') === 'REAUTH';

  const [isMobile,  setIsMobile]  = useState<boolean | null>(null);
  const [step,      setStep]      = useState<Step>(isReauth ? 3 : 1);
  const [loading,   setLoading]   = useState(false);
  const [form,      setForm]      = useState<FormData>({ fullName: '', idNumber: '' });
  const [camErr,    setCamErr]    = useState<string | null>(null);
  const [camOn,     setCamOn]     = useState(false);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setIsMobile(isMobileDevice()); }, []);

  useEffect(() => {
    if (!sessionId) console.error('CRITICAL: sessionId missing from URL');
  }, [sessionId]);

  // Stop camera on step change
  useEffect(() => {
    if (videoRef.current) stopStream(videoRef.current);
    setCamOn(false);
    setCamErr(null);
  }, [step]);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setCamErr(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamErr('Camera API not available on this device/browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCamOn(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.name : '';
      if (msg === 'NotAllowedError') {
        setCamErr('Camera permission denied. Please allow access in your browser settings.');
      } else if (msg === 'NotFoundError') {
        setCamErr('No camera found on this device.');
      } else {
        setCamErr('Could not start camera. Please try again.');
      }
    }
  }, []);

  const pushStep = useCallback(async (completedStep: number, extra: Record<string, unknown> = {}) => {
    if (!sessionId) { alert('Session ID missing — please re-scan the QR code.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, step: completedStep, data: extra }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Server error');
      }
      setStep((completedStep + 1) as Step);
    } catch (err: unknown) {
      alert('Verification error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const captureAndSubmit = useCallback(async (completedStep: 2 | 3) => {
    if (!videoRef.current || !canvasRef.current) return;
    const image = snapFrame(videoRef.current, canvasRef.current);
    stopStream(videoRef.current);
    setCamOn(false);
    await pushStep(completedStep, { [completedStep === 2 ? 'cinImage' : 'faceImage']: image });
  }, [pushStep]);

  // Wait for device detection
  if (isMobile === null) return null;

  // Desktop: show blocker
  if (!isMobile) return <DesktopBlocker />;

  // Mobile: full KYC flow
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-green-400 via-green-600 to-emerald-500" />

      <div className="flex-1 p-6 max-w-md mx-auto w-full flex flex-col">
        {/* Logo area */}
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

          {/* ── Step 1: Personal details ── */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Personal Info</h1>
              <p className="text-slate-500 text-sm mt-1 mb-8">
                Enter your details exactly as they appear on your national ID.
              </p>

              <div className="space-y-4">
                {([
                  { key: 'fullName' as const, label: 'Full Name',       placeholder: 'John ',  type: 'text' },
                  { key: 'idNumber' as const, label: 'CIN / ID Number', placeholder: '01234567',       type: 'text' },
                ]).map(({ key, label, placeholder, type }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      {label}
                    </label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-green-500 outline-none transition-colors text-base shadow-sm"
                    />
                  </div>
                ))}

                <div className="pt-2">
                  <button
                    onClick={() => pushStep(1, form)}
                    disabled={!form.fullName.trim() || !form.idNumber.trim()}
                    className="w-full py-4 bg-green-700 text-white rounded-xl font-bold text-base shadow-lg shadow-green-200 disabled:opacity-40 active:scale-[0.98] transition-all"
                  >
                    Continue →
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 pt-2">
                  🔒 Your data is encrypted and secure
                </p>
              </div>
            </div>
          )}

          {/* ── Steps 2 & 3: Camera (always mounted to keep ref stable) ── */}
          <div className={step === 2 || step === 3 ? 'block' : 'hidden'}>
            <div className="flex flex-col items-center">

              {step === 2 && (
                <div className="w-full mb-6">
                  <h1 className="text-2xl font-black text-slate-800">Scan Your ID</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Place your national ID card within the frame and tap <strong>Capture</strong>.
                  </p>
                </div>
              )}
              {step === 3 && (
                <div className="w-full mb-6">
                  <h1 className="text-2xl font-black text-slate-800">Face Verification</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Center your face in the circle and tap <strong>Verify</strong>.
                  </p>
                </div>
              )}

              {/* Camera viewport — shape changes via CSS, video always mounted */}
              <div
                className={`relative bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-500
                  ${step === 3
                    ? 'w-64 h-64 rounded-full border-[6px] border-green-300'
                    : 'w-full aspect-[3/2] rounded-2xl border-4 border-white'
                  }`}
              >
                <span className={`absolute text-6xl pointer-events-none transition-opacity duration-300 ${camOn ? 'opacity-0' : 'opacity-10'}`}>
                  {step === 3 ? '👤' : '🪪'}
                </span>

                {/* THE video — always in DOM, never conditionally unmounted */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300
                    ${step === 3 ? 'scale-x-[-1]' : ''}
                    ${camOn ? 'opacity-100' : 'opacity-0'}`}
                />

                {step === 2 && (
                  <div className="absolute inset-8 border-2 border-dashed border-green-400 rounded-lg pointer-events-none" />
                )}

                {/* "LIVE" badge */}
                {camOn && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                    LIVE
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
                  <button
                    onClick={() => startCamera(step === 3 ? 'user' : 'environment')}
                    className="w-full py-4 bg-green-700 text-white rounded-xl font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-green-200"
                  >
                    {step === 3 ? 'Open Front Camera' : 'Open Camera'}
                  </button>
                ) : (
                  <button
                    onClick={() => captureAndSubmit(step as 2 | 3)}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
                  >
                    {step === 3 ? '✓ Verify My Face' : '✓ Capture Photo'}
                  </button>
                )}
                {camOn && (
                  <button
                    onClick={() => { if (videoRef.current) stopStream(videoRef.current); setCamOn(false); }}
                    className="w-full py-3 text-slate-400 text-sm font-medium"
                  >
                    Retake
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Success ── */}
          {step === 4 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg shadow-green-100">
                ✓
              </div>
              <h1 className="text-3xl font-black text-slate-800">All Done!</h1>
              <p className="text-slate-500 mt-3 px-4 text-sm leading-relaxed">
                Your identity has been successfully verified. Your desktop session will update automatically.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-700 text-xs font-bold uppercase tracking-wider">Verification Complete</span>
              </div>
              <p className="text-xs text-slate-300 mt-10 uppercase font-bold tracking-widest">
                Safe to close this tab
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden />

      {loading && <LoadingOverlay />}
    </div>
  );
}