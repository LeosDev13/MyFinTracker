import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TransactionCache, type TransactionWithCompensation } from '../utils/TransactionCache';
import { useErrorHandler } from './useErrorHandler';

interface VirtualPaginationConfig {
  pageSize?: number;
  maxInMemoryItems?: number;
  windowSize?: number;
  preloadBuffer?: number;
  enablePrefetch?: boolean;
}

interface VirtualPaginationState {
  visibleTransactions: TransactionWithCompensation[];
  totalCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasNextPage: boolean;
  cacheStats: {
    cacheSize: number;
    memoryUsage: string;
  };
}

interface VirtualPaginationActions {
  loadRange: (startIndex: number, count: number) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  addTransaction: (transaction: TransactionWithCompensation) => void;
  updateTransaction: (transaction: TransactionWithCompensation) => void;
  removeTransaction: (transactionId: string) => void;
  getVisibleRange: () => { start: number; end: number };
  prefetchAroundIndex: (index: number) => Promise<void>;
}

type LoadTransactionsFunction = (
  limit: number,
  offset: number
) => Promise<{
  transactions: TransactionWithCompensation[];
  totalCount: number;
}>;

export const useVirtualPagination = (
  loadTransactions: LoadTransactionsFunction,
  config: VirtualPaginationConfig = {}
): [VirtualPaginationState, VirtualPaginationActions] => {
  const {
    pageSize = 20,
    maxInMemoryItems = 100,
    windowSize = 50,
    preloadBuffer = 20,
    enablePrefetch = true,
  } = config;

  const { handleError } = useErrorHandler();

  const cache = useRef(
    new TransactionCache({
      maxInMemoryItems,
      windowSize,
      preloadBuffer,
    })
  );

  const [state, setState] = useState<VirtualPaginationState>({
    visibleTransactions: [],
    totalCount: 0,
    isLoading: false,
    isRefreshing: false,
    error: null,
    hasNextPage: true,
    cacheStats: {
      cacheSize: 0,
      memoryUsage: '0%',
    },
  });

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: pageSize - 1 });
  const loadingRanges = useRef(new Set<string>());

  // Update visible transactions when range changes
  const updateVisibleTransactions = useCallback(() => {
    const transactions = cache.current.getTransactions(
      visibleRange.start,
      visibleRange.end - visibleRange.start + 1
    );

    const stats = cache.current.getStats();

    setState((prev) => ({
      ...prev,
      visibleTransactions: transactions,
      cacheStats: {
        cacheSize: stats.cacheSize,
        memoryUsage: stats.memoryUsage,
      },
    }));
  }, [visibleRange]);

  // Load a specific range of transactions
  const loadRange = useCallback(
    async (startIndex: number, count: number): Promise<void> => {
      const rangeKey = `${startIndex}-${count}`;

      // Prevent duplicate loading
      if (loadingRanges.current.has(rangeKey)) {
        return;
      }

      // Check if range is already cached
      if (cache.current.isRangeCached(startIndex, count)) {
        updateVisibleTransactions();
        return;
      }

      loadingRanges.current.add(rangeKey);
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const missingRanges = cache.current.getMissingRanges(startIndex, count);

        // Load all missing ranges
        for (const range of missingRanges) {
          const result = await loadTransactions(range.count, range.start);
          cache.current.addTransactions(result.transactions, range.start, result.totalCount);

          setState((prev) => ({
            ...prev,
            totalCount: result.totalCount,
            hasNextPage: range.start + result.transactions.length < result.totalCount,
          }));
        }

        updateVisibleTransactions();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load transactions';
        await handleError(error as Error, { showToast: true });
        setState((prev) => ({ ...prev, error: errorMessage }));
      } finally {
        loadingRanges.current.delete(rangeKey);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [loadTransactions, handleError, updateVisibleTransactions]
  );

  // Refresh all data
  const refresh = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isRefreshing: true, error: null }));

    try {
      cache.current.clear();
      setVisibleRange({ start: 0, end: pageSize - 1 });
      await loadRange(0, pageSize);
    } catch (error) {
      await handleError(error as Error, { showToast: true });
    } finally {
      setState((prev) => ({ ...prev, isRefreshing: false }));
    }
  }, [loadRange, pageSize, handleError]);

  // Load more transactions (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (state.isLoading || !state.hasNextPage) {
      return;
    }

    const nextStart = cache.current.getStats().cacheSize;
    await loadRange(nextStart, pageSize);

    // Extend visible range to include new items
    setVisibleRange((prev) => ({
      start: prev.start,
      end: Math.max(prev.end, nextStart + pageSize - 1),
    }));
  }, [state.isLoading, state.hasNextPage, loadRange, pageSize]);

  // Add a new transaction (typically at the beginning)
  const addTransaction = useCallback(
    (transaction: TransactionWithCompensation): void => {
      cache.current.addTransaction(transaction, 0);
      setState((prev) => ({
        ...prev,
        totalCount: prev.totalCount + 1,
      }));
      updateVisibleTransactions();
    },
    [updateVisibleTransactions]
  );

  // Update an existing transaction
  const updateTransaction = useCallback(
    (transaction: TransactionWithCompensation): void => {
      cache.current.updateTransaction(transaction);
      updateVisibleTransactions();
    },
    [updateVisibleTransactions]
  );

  // Remove a transaction
  const removeTransaction = useCallback(
    (transactionId: string): void => {
      if (cache.current.removeTransaction(transactionId)) {
        setState((prev) => ({
          ...prev,
          totalCount: Math.max(0, prev.totalCount - 1),
        }));
        updateVisibleTransactions();
      }
    },
    [updateVisibleTransactions]
  );

  // Get current visible range
  const getVisibleRange = useCallback(() => visibleRange, [visibleRange]);

  // Prefetch data around a specific index
  const prefetchAroundIndex = useCallback(
    async (index: number): Promise<void> => {
      if (!enablePrefetch) return;

      const prefetchStart = Math.max(0, index - preloadBuffer);
      const prefetchEnd = Math.min(state.totalCount - 1, index + preloadBuffer);
      const prefetchCount = prefetchEnd - prefetchStart + 1;

      if (prefetchCount > 0) {
        await loadRange(prefetchStart, prefetchCount);
      }
    },
    [enablePrefetch, preloadBuffer, state.totalCount, loadRange]
  );

  // Initialize with first page
  useEffect(() => {
    if (state.totalCount === 0 && !state.isLoading && !state.isRefreshing) {
      loadRange(0, pageSize);
    }
  }, [loadRange, pageSize, state.totalCount, state.isLoading, state.isRefreshing]);

  const actions = useMemo(
    () => ({
      loadRange,
      refresh,
      loadMore,
      addTransaction,
      updateTransaction,
      removeTransaction,
      getVisibleRange,
      prefetchAroundIndex,
    }),
    [
      loadRange,
      refresh,
      loadMore,
      addTransaction,
      updateTransaction,
      removeTransaction,
      getVisibleRange,
      prefetchAroundIndex,
    ]
  );

  return [state, actions];
};
