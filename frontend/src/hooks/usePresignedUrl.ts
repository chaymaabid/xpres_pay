import { useEffect, useState } from 'react';
import { authApi } from '@/lib/authApi';

// Cache so we don't refetch the same key within a session
const cache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Given a productId and imageId, fetches a presigned URL from the backend
 * and caches it for 50 minutes (presigned URLs are valid for 1 hour).
 */
export function usePresignedUrl(productId: string, imageId: string) {
  const cacheKey = `${productId}:${imageId}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  const [url, setUrl] = useState<string | null>(
    cached && cached.expiresAt > now ? cached.url : null
  );
  const [loading, setLoading] = useState(!url);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Already valid in cache
    if (url) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    authApi
      .get<{ url: string }>(`/api/v1/products/${productId}/images/${imageId}/url`)
      .then((res) => {
        if (cancelled) return;
        const presigned = res.data.url;
        // Cache for 50 min (3 000 000 ms) — expires before the 1h minio TTL
        cache.set(cacheKey, { url: presigned, expiresAt: Date.now() + 50 * 60 * 1000 });
        setUrl(presigned);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [productId, imageId]);

  return { url, loading, error };
}