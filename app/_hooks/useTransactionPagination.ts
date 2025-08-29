import { useCallback, useMemo, useState } from 'react';
import type { Transaction } from '../../src/db/database';

interface PaginationConfig {
  pageSize?: number;
  initialPage?: number;
}

interface PaginationState {
  transactions: Transaction[];
  hasNextPage: boolean;
  isLoading: boolean;
  currentPage: number;
  totalCount: number;
}

interface PaginationActions {
  loadNextPage: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

type LoadTransactionsFunction = (
  limit: number,
  offset: number
) => Promise<{
  transactions: Transaction[];
  totalCount: number;
}>;

export const useTransactionPagination = (
  loadTransactions: LoadTransactionsFunction,
  config: PaginationConfig = {}
): [PaginationState, PaginationActions] => {
  const { pageSize = 20, initialPage = 1 } = config;

  const [state, setState] = useState<PaginationState>({
    transactions: [],
    hasNextPage: true,
    isLoading: false,
    currentPage: initialPage,
    totalCount: 0,
  });

  const loadNextPage = useCallback(async () => {
    if (state.isLoading || !state.hasNextPage) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const offset = (state.currentPage - 1) * pageSize;
      const result = await loadTransactions(pageSize, offset);

      setState((prev) => {
        const newTransactions =
          state.currentPage === 1
            ? result.transactions
            : [...prev.transactions, ...result.transactions];

        return {
          ...prev,
          transactions: newTransactions,
          hasNextPage:
            result.transactions.length === pageSize && newTransactions.length < result.totalCount,
          currentPage: prev.currentPage + 1,
          totalCount: result.totalCount,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.currentPage, state.hasNextPage, state.isLoading, loadTransactions, pageSize]);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      transactions: [],
      currentPage: initialPage,
      hasNextPage: true,
      totalCount: 0,
    }));
    await loadNextPage();
  }, [loadNextPage, initialPage]);

  const reset = useCallback(() => {
    setState({
      transactions: [],
      hasNextPage: true,
      isLoading: false,
      currentPage: initialPage,
      totalCount: 0,
    });
  }, [initialPage]);

  const actions = useMemo(
    () => ({
      loadNextPage,
      refresh,
      reset,
    }),
    [loadNextPage, refresh, reset]
  );

  return [state, actions];
};
