import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StatusBar, Text, View } from 'react-native';
import { useApp, useSettings } from '../src/context';
import { RepositoryFactory } from '../src/repositories/RepositoryFactory';
import VirtualizedTransactionList from './_components/VirtualizedTransactionList';
import { useTransactionPagination } from './_hooks/useTransactionPagination';

const TransactionsScreen = () => {
  const { state } = useApp();
  const { getFormattedCurrency, getFormattedDate } = useSettings();

  // Repository factory instance
  const repositoryFactory = useMemo(() => RepositoryFactory.getInstance(), []);

  // Load transactions function for pagination
  const loadTransactions = useCallback(
    async (limit: number, offset: number) => {
      const transactionRepo = repositoryFactory.getTransactionRepository();
      const [transactions, totalCount] = await Promise.all([
        transactionRepo.findAllWithCompensationInfo(limit, offset),
        transactionRepo.count(),
      ]);

      return { transactions, totalCount };
    },
    [repositoryFactory]
  );

  // Pagination hook
  const [paginationState, paginationActions] = useTransactionPagination(loadTransactions, {
    pageSize: 25,
  });

  // Initialize on focus
  useFocusEffect(
    useCallback(() => {
      paginationActions.refresh();
    }, [paginationActions])
  );

  // Use paginated transactions or fallback to context transactions
  const displayTransactions =
    paginationState.transactions.length > 0 ? paginationState.transactions : state.transactions;

  const isRefreshing = state.refreshing || paginationState.isLoading;

  const handleRefresh = useCallback(async () => {
    await paginationActions.refresh();
  }, [paginationActions]);

  const handleEndReached = useCallback(() => {
    if (paginationState.hasNextPage && !paginationState.isLoading) {
      paginationActions.loadNextPage();
    }
  }, [paginationState.hasNextPage, paginationState.isLoading, paginationActions]);

  // Header component
  const ListHeader = useCallback(
    () => (
      <View className="px-6 pt-14 pb-5">
        <Text className="text-3xl font-bold text-gray-900 mb-2">All Transactions</Text>
        <Text className="text-base text-gray-600">
          {paginationState.totalCount > 0
            ? `${paginationState.totalCount} transactions total`
            : 'Manage your financial transactions'}
        </Text>
      </View>
    ),
    [paginationState.totalCount]
  );

  return (
    <View className="flex-1 bg-soft-pink">
      <StatusBar barStyle="dark-content" className="bg-soft-pink" />

      <VirtualizedTransactionList
        transactions={displayTransactions}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        hasNextPage={paginationState.hasNextPage}
        getFormattedDate={getFormattedDate}
        getFormattedCurrency={getFormattedCurrency}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{
          paddingBottom: 100,
          flexGrow: 1,
        }}
      />
    </View>
  );
};

export default TransactionsScreen;
