'use client';

import { useEffect, useRef, useState } from 'react';
import { Product, ProductImage } from '@/app/services/product.service';
import { updateProduct, deleteProductImage, addProductImage } from '@/app/services/product.service';
import PresignedImage from './PresignedImage';

interface EditForm {
  price: string;
  description: string;
  stockAvailable: string;
}

export default function ProductEditModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<EditForm>({
    price: String(product.price),
    description: product.description ?? '',
    stockAvailable: String(product.stockAvailable),
  });
  const [images, setImages] = useState<ProductImage[]>(product.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const totalImages = images.length + newFiles.length + files.length;
    if (totalImages > 5) {
      setError('Maximum 5 images allowed.');
      return;
    }
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleDeleteExisting = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeletedImageIds((prev) => [...prev, imageId]);
  };

  const handleDeleteNew = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // 1. Update fields
      await updateProduct(product.id, {
        price: parseFloat(form.price),
        description: form.description,
        stockAvailable: parseInt(form.stockAvailable, 10),
      });

      // 2. Delete removed images
      for (const id of deletedImageIds) {
        await deleteProductImage(product.id, id);
      }

      // 3. Upload new images
      for (const file of newFiles) {
        await addProductImage(product.id, file);
      }

      onSave();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto animate-in">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Product</h2>
            <p className="text-xs text-gray-400 mt-0.5">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2B6E44]/30 focus:border-[#2B6E44] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Stock Qty
              </label>
              <input
                type="number"
                min="0"
                value={form.stockAvailable}
                onChange={(e) => setForm({ ...form, stockAvailable: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2B6E44]/30 focus:border-[#2B6E44] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#2B6E44]/30 focus:border-[#2B6E44] transition-all"
            />
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Images ({images.length + newFiles.length}/5)
              </label>
              {images.length + newFiles.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#2B6E44] hover:text-[#1e3a2a] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add photo
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Existing images */}
              {images.map((img) => (
                <ImageThumb
                  key={img.id}
                  productId={product.id}
                  imageId={img.id}
                  onDelete={() => handleDeleteExisting(img.id)}
                />
              ))}

              {/* New (local preview) images */}
              {newPreviews.map((src, i) => (
                <ImageThumb
                  key={`new-${i}`}
                  src={src}
                  isNew
                  onDelete={() => handleDeleteNew(i)}
                />
              ))}

              {/* Empty add slot */}
              {images.length + newFiles.length === 0 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-[#2B6E44]/50 hover:text-[#2B6E44]/60 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px]">Add</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#1e3a2a] hover:bg-[#2B6E44] text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
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

function ImageThumb({
  src,
  productId,
  imageId,
  onDelete,
  isNew = false,
}: {
  src?: string;          // used for new (local preview) images
  productId?: string;    // used for existing images
  imageId?: string;      // used for existing images
  onDelete: () => void;
  isNew?: boolean;
}) {
  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100">
      {isNew && src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <PresignedImage
          productId={productId!}
          imageId={imageId!}
          className="w-full h-full object-cover"
        />
      )}
      {isNew && (
        <span className="absolute top-1.5 left-1.5 bg-[#2B6E44] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
          New
        </span>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-150 flex items-center justify-center">
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50"
        >
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}