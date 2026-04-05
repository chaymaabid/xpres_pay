'use client';

import { useState } from 'react';
import { Product } from '@/app/services/product.service';
import PresignedImage from '../../../components/PresignedProductImage';
import ProductDetailsModal from './ProductDetailsModal';
import ProductEditModal from './ProductEditModal';

function StockBadge({ stockAvailable }: { stockAvailable: number }) {
  const config =
    stockAvailable === 0
      ? { label: 'Out of stock', className: 'bg-red-50 text-red-500 border border-red-100' }
      : stockAvailable < 5
      ? { label: 'Low stock', className: 'bg-amber-50 text-amber-600 border border-amber-100' }
      : { label: 'In stock', className: 'bg-emerald-50 text-emerald-600 border border-emerald-100' };

  return (
    <span className={`absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

export default function ProductCard({ product, onUpdate }: { product: Product; onUpdate: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Pick a random image object from the array
  const randomImage = product.images?.length
    ? product.images[Math.floor(Math.random() * product.images.length)]
    : null;

  return (
    <>
      <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        {/* Image */}
        <div className="relative w-full h-48 bg-gray-50 overflow-hidden">
          {randomImage ? (
            <PresignedImage
              productId={product.id}
              imageId={randomImage.id}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <svg className="w-14 h-14 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <StockBadge stockAvailable={product.stockAvailable} />
          {product.images?.length > 1 && (
            <span className="absolute bottom-2.5 left-3 bg-black/40 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full">
              {product.images.length} photos
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 text-[15px] leading-tight mb-0.5 truncate">{product.name}</h3>
          <p className="text-[#2B6E44] font-bold text-xl mb-1.5">${Number(product.price).toFixed(2)}</p>
          <p className="text-gray-400 text-[13px] leading-relaxed line-clamp-2 flex-1">{product.description}</p>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowDetails(true)}
              className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
            >
              Details
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="flex-1 bg-[#1e3a2a] hover:bg-[#2B6E44] text-white text-sm font-medium py-2 rounded-lg transition-all duration-150"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <ProductDetailsModal product={product} onClose={() => setShowDetails(false)} />
      )}
      {showEdit && (
        <ProductEditModal
          product={product}
          onClose={() => setShowEdit(false)}
          onSave={() => {
            setShowEdit(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}