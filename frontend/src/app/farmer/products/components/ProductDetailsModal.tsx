'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/services/product.service';
import PresignedImage from '../../../components/PresignedProductImage';

export default function ProductDetailsModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = product.images ?? [];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const prev = () => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  const stockColor =
    product.stockAvailable === 0
      ? 'text-red-500 bg-red-50 border-red-100'
      : product.stockAvailable < 5
      ? 'text-amber-600 bg-amber-50 border-amber-100'
      : 'text-emerald-600 bg-emerald-50 border-emerald-100';

  const stockLabel =
    product.stockAvailable === 0 ? 'Out of stock' : product.stockAvailable < 5 ? 'Low stock' : 'In stock';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image carousel */}
        <div className="relative w-full h-72 bg-gray-50 overflow-hidden rounded-t-2xl">
          {images.length > 0 ? (
            <>
              <PresignedImage
                key={currentIndex}
                productId={product.id}
                imageId={images[currentIndex].id}
                alt={`${product.name} ${currentIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentIndex ? 'bg-white w-5' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-[#2B6E44] font-bold text-2xl mt-1">${Number(product.price).toFixed(2)}</p>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${stockColor}`}>
              {stockLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Stock Available</p>
              <p className="text-xl font-bold text-gray-800">{product.stockAvailable} <span className="text-sm font-normal text-gray-500">units</span></p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Photos</p>
              <p className="text-xl font-bold text-gray-800">{images.length} <span className="text-sm font-normal text-gray-500">uploaded</span></p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Description</p>
            <p className="text-gray-600 text-sm leading-relaxed">{product.description || '—'}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes animate-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: animate-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}