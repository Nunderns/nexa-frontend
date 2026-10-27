import { useCallback, useEffect, useRef, useState } from 'react';
import type { Paginated } from '@/types/api';

/**
 * Page-number pagination for "load more" lists. The first page is (re)loaded
 * whenever `key` changes; `loadMore` appends the next one.
 *
 * Errors are kept raw so the caller translates them at render time and a
 * language switch does not need a refetch.
 */
export function usePaginatedList<T>(key: unknown, fetchPage: (page: number) => Promise<Paginated<T>>) {
  // Read through a ref so a fresh closure every render does not refetch.
  const fetchRef = useRef(fetchPage);
  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRef
      .current(1)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setItems(response.data);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        setPage(1);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err ?? new Error('load failed'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const response = await fetchRef.current(page + 1);
      setItems((current) => [...current, ...response.data]);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setPage(response.page);
    } catch (err) {
      setError(err ?? new Error('load failed'));
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore: page < totalPages && items.length < total,
    loadMore,
  };
}
