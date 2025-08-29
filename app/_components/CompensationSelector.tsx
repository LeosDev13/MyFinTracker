import { Check } from 'lucide-react-native';
import React from 'react';
import { FlatList, type ListRenderItem, Text, TouchableOpacity, View } from 'react-native';
import type { Transaction } from '../../src/db/database';

interface CompensationSelectorProps {
  transactions: Transaction[];
  selectedTransactionId: string | null;
  onSelect: (transactionId: string | null) => void;
}

const CompensationSelector = React.memo<CompensationSelectorProps>(
  ({ transactions, selectedTransactionId, onSelect }) => {
    const keyExtractor = React.useCallback((item: Transaction) => item.id, []);

    const renderItem: ListRenderItem<Transaction> = React.useCallback(
      ({ item: transaction }) => (
        <TouchableOpacity
          onPress={() => onSelect(transaction.id)}
          className={`p-4 border-b border-gray-100 flex-row items-center justify-between ${
            selectedTransactionId === transaction.id ? 'bg-[#C4D7C0]' : 'bg-white'
          }`}
        >
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-1">
              <View className="flex-1 pr-2">
                <Text
                  className={`text-base font-medium ${
                    selectedTransactionId === transaction.id ? 'text-[#1F5F43]' : 'text-gray-900'
                  }`}
                  numberOfLines={1}
                >
                  {transaction.currency_symbol}
                  {transaction.amount.toFixed(2)}
                </Text>
                {/* @ts-ignore - compensated_amount comes from query but not in main Transaction type */}
                {transaction.compensated_amount > 0 && (
                  <Text
                    className={`text-xs mt-0.5 ${
                      selectedTransactionId === transaction.id
                        ? 'text-[#1F5F43]'
                        : 'text-orange-600'
                    }`}
                    numberOfLines={1}
                  >
                    {/* @ts-ignore - compensated_amount comes from query but not in main Transaction type */}
                    Remaining: {transaction.currency_symbol}
                    {(transaction.amount - transaction.compensated_amount).toFixed(2)}
                  </Text>
                )}
              </View>
              <Text
                className={`text-sm flex-shrink-0 ${
                  selectedTransactionId === transaction.id ? 'text-[#1F5F43]' : 'text-gray-500'
                }`}
              >
                {transaction.date}
              </Text>
            </View>
            <Text
              className={`text-sm ${
                selectedTransactionId === transaction.id ? 'text-[#1F5F43]' : 'text-gray-600'
              }`}
              numberOfLines={1}
            >
              {transaction.category_name} • {transaction.type_name}
            </Text>
            {transaction.note && (
              <Text
                className={`text-xs mt-1 ${
                  selectedTransactionId === transaction.id ? 'text-[#1F5F43]' : 'text-gray-500'
                }`}
                numberOfLines={2}
              >
                {transaction.note}
              </Text>
            )}
          </View>
          {selectedTransactionId === transaction.id && <Check size={16} color="#1F5F43" />}
        </TouchableOpacity>
      ),
      [selectedTransactionId, onSelect]
    );

    const renderHeader = React.useCallback(
      () => (
        <TouchableOpacity
          onPress={() => onSelect(null)}
          className={`p-4 border-b border-gray-100 flex-row items-center justify-between ${
            selectedTransactionId === null ? 'bg-[#C4D7C0]' : 'bg-white'
          }`}
        >
          <Text
            className={`text-base font-medium ${
              selectedTransactionId === null ? 'text-[#1F5F43]' : 'text-gray-700'
            }`}
          >
            No specific transaction (general compensation)
          </Text>
          {selectedTransactionId === null && <Check size={16} color="#1F5F43" />}
        </TouchableOpacity>
      ),
      [selectedTransactionId, onSelect]
    );

    return (
      <View className="mt-4">
        <Text className="text-lg font-bold text-[#1C2B2E] mb-3">
          Select Transaction to Compensate
        </Text>
        <View className="border border-gray-200 rounded-lg bg-white max-h-64">
          <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(_, index) => ({
              length: 85, // Approximate item height
              offset: 85 * index,
              index,
            })}
          />
        </View>
      </View>
    );
  }
);

export default CompensationSelector;
export { CompensationSelector };
