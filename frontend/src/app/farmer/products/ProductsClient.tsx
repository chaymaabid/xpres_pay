'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/services/product.service';
import ProductCard from '@/app/farmer/products/components/ProductCard';
import ProductAddModal from '@/app/farmer/products/components/ProductAddModal';

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  const handleUpdate = () => router.refresh();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-16">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your product listings and inventory</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#1e3a2a] hover:bg-[#2B6E44] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {initialProducts.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          initialProducts.map((product) => (
            <ProductCard key={product.id} product={product} onUpdate={handleUpdate} />
          ))
        )}
      </div>

      {showAdd && (
        <ProductAddModal
          onClose={() => setShowAdd(false)}
          onSave={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-5">
        Add your first product to start managing your listings and inventory.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-[#1e3a2a] hover:bg-[#2B6E44] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add your first product
      </button>
    </div>
  );
}