'use client';

import { usePresignedUrl } from '@/hooks/usePresignedUrl';

interface PresignedImageProps {
  productId: string;
  imageId: string;
  alt?: string;
  className?: string;
}

/**
 * Drop-in <img> replacement that resolves a MinIO presigned URL
 * before rendering. Shows a shimmer while loading.
 */
export default function PresignedImage({
  productId,
  imageId,
  alt = '',
  className = '',
}: PresignedImageProps) {
  const { url, loading, error } = usePresignedUrl(productId, imageId);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 ${className}`} />
    );
  }

  if (error || !url) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
        <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return <img src={url} alt={alt} className={className} />;
}