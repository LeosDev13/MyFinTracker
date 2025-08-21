import React from 'react';
import { Text, View } from 'react-native';
import type { Transaction } from '../../src/db/database';

interface TransactionItemProps {
  transaction: Transaction & {
    compensated_amount?: number;
    remaining_amount?: number;
    is_fully_compensated?: boolean;
  };
  getFormattedDate: (date: Date) => string;
  getFormattedCurrency: (amount: number, symbol?: string) => string;
}

const TransactionItem = React.memo(
  ({ transaction, getFormattedDate, getFormattedCurrency }: TransactionItemProps) => {
    return (
      <View className="flex-row justify-between items-start py-3 px-4 border-b border-gray-100">
        <View className="flex-1 pr-3">
          <Text className="text-base text-gray-800 font-medium" numberOfLines={1}>
            {transaction.note}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {getFormattedDate(new Date(transaction.date))}
          </Text>
          {transaction.category_name && (
            <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
              {transaction.category_name}
            </Text>
          )}
        </View>
        <View className="items-end flex-shrink-0 min-w-0 max-w-[45%]">
          <Text
            className={`text-base font-bold text-right ${
              transaction.is_fully_compensated
                ? 'text-gray-400 line-through'
                : transaction.type_name === 'Income'
                  ? 'text-green-600'
                  : 'text-red-600'
            }`}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {transaction.type_name === 'Income' ? '+' : '-'}
            {getFormattedCurrency(
              transaction.is_fully_compensated
                ? transaction.amount
                : (transaction.remaining_amount ?? transaction.amount),
              transaction.currency_symbol
            )}
          </Text>
          {transaction.is_fully_compensated && (
            <View className="mt-1 bg-green-100 px-2 py-0.5 rounded self-end">
              <Text className="text-xs text-green-700 font-medium">Compensated</Text>
            </View>
          )}
          {transaction.compensated_amount &&
            transaction.compensated_amount > 0 &&
            !transaction.is_fully_compensated && (
              <Text className="text-xs text-orange-600 mt-0.5 text-right" numberOfLines={1}>
                {getFormattedCurrency(transaction.compensated_amount, transaction.currency_symbol)}{' '}
                compensated
              </Text>
            )}
          <Text className="text-xs text-gray-400 mt-0.5 text-right">{transaction.type_name}</Text>
        </View>
      </View>
    );
  }
);

TransactionItem.displayName = 'TransactionItem';

export default TransactionItem;
