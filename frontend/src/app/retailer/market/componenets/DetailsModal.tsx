'use client';

import { useEffect, useState } from 'react';
import { ProductMarket } from '@/app/services/product.service';
import PresignedImage from '@/app/components/PresignedProductImage';

export default function RetailerDetailsModal({
  product,
  onClose,
}: {
  product: ProductMarket;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = product.images ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Keep all images mounted, just show/hide — avoids re-fetching presigned URLs on slide
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  const stockConfig =
    product.stockAvailable === 0
      ? { label: 'Out of stock', dot: 'bg-red-400', className: 'text-red-500 bg-red-50 border border-red-100' }
      : product.stockAvailable < 5
      ? { label: 'Low stock',    dot: 'bg-amber-400', className: 'text-amber-600 bg-amber-50 border border-amber-100' }
      : { label: 'In stock',     dot: 'bg-emerald-400', className: 'text-emerald-600 bg-emerald-50 border border-emerald-100' };

  const scoreColor =
    product.owner.trustScore >= 75 ? 'text-emerald-600' :
    product.owner.trustScore >= 50 ? 'text-amber-500' : 'text-red-500';

  const scoreBg =
    product.owner.trustScore >= 75 ? 'bg-emerald-50 border-emerald-100' :
    product.owner.trustScore >= 50 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — wider for editorial feel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col modal-enter">

        {/* ── TOP: Image carousel ──────────────────────────────────── */}
        {/* FIX: overflow-hidden moved to inner image wrapper, NOT on the container
            so arrow buttons (absolutely positioned) are never clipped */}
        <div className="relative w-full h-72 bg-gray-50 shrink-0">

          {/* All images mounted at once — show/hide with opacity to avoid re-fetch */}
          {images.length > 0 ? (
            <>
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ opacity: i === currentIndex ? 1 : 0, pointerEvents: i === currentIndex ? 'auto' : 'none' }}
                >
                  {/* overflow-hidden here only clips the image, not the arrows */}
                  <div className="absolute inset-0 overflow-hidden rounded-t-3xl">
                    <PresignedImage
                      productId={product.id}
                      imageId={img.id}
                      alt={`${product.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}

              {/* Arrows — outside the overflow-hidden div so they're always clickable */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-105 transition-all"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-105 transition-all"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 items-center">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                        className={`rounded-full transition-all duration-200 ${
                          i === currentIndex ? 'bg-white w-5 h-1.5' : 'bg-white/50 w-1.5 h-1.5'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Counter pill */}
                  <div className="absolute top-4 left-4 z-20 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {currentIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-t-3xl bg-gradient-to-br from-gray-50 to-gray-100">
              <svg className="w-14 h-14 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-300">No photos</span>
            </div>
          )}

          {/* Close button — top right, always on top */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── BOTTOM: Scrollable content ───────────────────────────── */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">

            {/* Editorial header: name large, price prominent, stock pill */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">
                  {product.name}
                </h2>
                <span className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mt-1 ${stockConfig.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stockConfig.dot}`} />
                  {stockConfig.label}
                </span>
              </div>

              {/* Price + stock on one line */}
              <div className="flex items-baseline gap-4 mt-2">
                <span className="text-3xl font-black text-[#1e3a2a]">
                  ${Number(product.price).toFixed(2)}
                </span>
                <span className="text-sm text-gray-400">
                  {product.stockAvailable} units available
                </span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <>
                <div className="w-full h-px bg-gray-100" />
                <div>
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">About this product</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              </>
            )}

            {/* Seller card — editorial style */}
            <div className="w-full h-px bg-gray-100" />
            <div>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-3">Sold by</p>

              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-[#1e3a2a] flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-white font-black text-base">
                      {product.owner.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-tight">{product.owner.email}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {/* Verified checkmark */}
                      <svg className="w-3 h-3 text-[#2B6E44]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[11px] text-[#2B6E44] font-medium">Verified Farmer</span>
                    </div>
                  </div>
                </div>

                {/* Trust score badge */}
                <div className={`flex flex-col items-center px-4 py-2 rounded-xl border ${scoreBg}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Trust Score</span>
                  <span className={`text-xl font-black leading-tight ${scoreColor}`}>
                    {product.owner.trustScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Purchase CTA */}
            <button className="w-full flex items-center justify-center gap-2.5 bg-[#1e3a2a] hover:bg-[#2B6E44] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl transition-all duration-150 shadow-sm text-[15px]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 10 19h9v-2h-8.42a.25.25 0 0 1-.22-.37L11.1 14h5.45a2 2 0 0 0 1.8-1.11l3.58-6.49A1 1 0 0 0 21 5H6.21l-.94-2zM7 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
              </svg>
              Purchase Now
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .modal-enter { animation: modal-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}