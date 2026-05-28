'use client';
import PresignedImage from "@/app/components/PresignedProductImage";
import { Product, ProductMarket } from "@/services/product.service";
import { useState } from "react";
import RetailerDetailsModal from './DetailsModal';
import { useCartContext } from "@/context/CartContext";

export default function ProductCard({ product}: { product: ProductMarket}) {
 
  const randomImage = product.images?.length
    ? product.images[Math.floor(Math.random() * product.images.length)]
    : null;
  const [showDetails, setShowDetails] = useState(false);
  const {addItem, openCart} = useCartContext();

  const handleAddToCart=()=>{
    addItem({
      productId:product.id,
      productName:product.name,
      price: Number(product.price),
      farmerId: product.owner.id,
      farmerName: product.owner.name,
      imageId: randomImage?.id,
      stockAvailable:product.stockAvailable,
    });
    openCart();
  };
  return (
    <>
      <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        <div className="relative w-full h-48 bg-gray-50 overflow-hidden">
          {randomImage ? (
            <>
              <PresignedImage
                productId={product.id}
                imageId={randomImage.id}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm group-hover:scale-105"
              />
              {/* Eye button — appears on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => setShowDetails(true)}
                  className="w-12 h-12 bg-[#1e3a2a] rounded-full flex items-center justify-center shadow-lg hover:bg-[#2B6E44] transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                
                <button
                  onClick={() => setShowDetails(true)}
                  className="w-12 h-12 bg-[#1e3a2a] rounded-full flex items-center justify-center shadow-lg hover:bg-[#2B6E44] transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            <div
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer"
              onClick={() => setShowDetails(true)}
            >
              <svg className="w-14 h-14 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            </>
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

          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleAddToCart}
              disabled={product.stockAvailable==0}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#185c3d] transition-all duration-200 shadow-sm">
            <svg   className="w-4 h-4"    fill="currentColor"    viewBox="0 0 24 24">
            <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 10 19h9v-2h-8.42a.25.25 0 0 1-.22-.37L11.1 14h5.45a2 2 0 0 0 1.8-1.11l3.58-6.49A1 1 0 0 0 21 5H6.21l-.94-2zM7 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
            </svg>

              add to cart
            </button>
          
          </div>
        </div>
      </div>
      {showDetails && (
        <RetailerDetailsModal
          product={product}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );

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
}