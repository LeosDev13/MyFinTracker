import React from 'react';
import {
  FlatList,
  type ListRenderItem,
  RefreshControl,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { Transaction } from '../../src/db/database';
import TransactionItem from './TransactionItem';

interface VirtualizedTransactionListProps {
  transactions: Array<
    Transaction & {
      compensated_amount?: number;
      remaining_amount?: number;
      is_fully_compensated?: boolean;
    }
  >;
  refreshing: boolean;
  onRefresh: () => void;
  onEndReached?: () => void;
  hasNextPage?: boolean;
  getFormattedDate: (date: Date) => string;
  getFormattedCurrency: (amount: number, symbol?: string) => string;
  ListHeaderComponent?: React.ComponentType<unknown> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<unknown> | React.ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

// Constantes para optimización de memoria y rendimiento
const ITEM_HEIGHT = 80; // Altura aproximada de cada item
const INITIAL_NUM_TO_RENDER = 8; // Reducido para mejor memoria inicial
const MAX_TO_RENDER_PER_BATCH = 3; // Reducido para evitar spikes de memoria
const WINDOW_SIZE = 8; // Reducido para menor uso de memoria
const SCROLL_EVENT_THROTTLE = 100; // Throttle para scroll events

const VirtualizedTransactionList = React.memo(
  ({
    transactions,
    refreshing,
    onRefresh,
    onEndReached,
    hasNextPage = false,
    getFormattedDate,
    getFormattedCurrency,
    ListHeaderComponent,
    ListFooterComponent,
    contentContainerStyle,
  }: VirtualizedTransactionListProps) => {
    const keyExtractor = React.useCallback(
      (
        item: Transaction & {
          compensated_amount?: number;
          remaining_amount?: number;
          is_fully_compensated?: boolean;
        }
      ) => item.id,
      []
    );

    const renderItem: ListRenderItem<
      Transaction & {
        compensated_amount?: number;
        remaining_amount?: number;
        is_fully_compensated?: boolean;
      }
    > = React.useCallback(
      ({ item }) => (
        <TransactionItem
          transaction={item}
          getFormattedDate={getFormattedDate}
          getFormattedCurrency={getFormattedCurrency}
        />
      ),
      [getFormattedDate, getFormattedCurrency]
    );

    const getItemLayout = React.useCallback(
      (
        _: ArrayLike<
          Transaction & {
            compensated_amount?: number;
            remaining_amount?: number;
            is_fully_compensated?: boolean;
          }
        >,
        index: number
      ) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      }),
      []
    );

    const renderEmptyComponent = React.useCallback(
      () => (
        <View className="py-8">
          <Text className="text-gray-500 text-center text-base">No transactions found</Text>
        </View>
      ),
      []
    );

    const renderFooter = React.useCallback(() => {
      if (ListFooterComponent) {
        return typeof ListFooterComponent === 'function' ? (
          <ListFooterComponent />
        ) : (
          ListFooterComponent
        );
      }

      if (hasNextPage) {
        return (
          <View className="py-4">
            <Text className="text-center text-gray-500">Loading more...</Text>
          </View>
        );
      }

      return null;
    }, [ListFooterComponent, hasNextPage]);

    return (
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        // Performance optimizations
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
        windowSize={WINDOW_SIZE}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        // Refresh control
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1F5F43"
            colors={['#1F5F43']}
          />
        }
        // Pagination
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        // Empty state
        ListEmptyComponent={renderEmptyComponent}
        // Header and footer
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={renderFooter}
        // Styling
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        // Additional memory and performance optimizations
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE}
        // Memory optimization settings
        disableVirtualization={false}
        legacyImplementation={false}
        // Reduce memory pressure
        maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        windowSize={WINDOW_SIZE}
        // Performance optimizations
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    );
  }
);

VirtualizedTransactionList.displayName = 'VirtualizedTransactionList';

export default VirtualizedTransactionList;
