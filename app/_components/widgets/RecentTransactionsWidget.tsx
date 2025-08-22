import { X } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useApp, useSettings } from "../../../src/context";
import type { WidgetProps } from "../../../src/types/widget";

const RecentTransactionsWidget: React.FC<WidgetProps> = ({
  widget,
  onRemove,
}) => {
  const { state } = useApp();
  const { getFormattedCurrency, getFormattedDate } = useSettings();

  const recentTransactions = (state?.transactions || []).slice(0, 5);

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-gray-900">
          {widget.title}
        </Text>
        {onRemove && (
          <TouchableOpacity onPress={() => onRemove(widget.id)} className="p-1">
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {recentTransactions.length === 0 ? (
        <View className="py-4">
          <Text className="text-gray-500 text-center text-sm">
            No recent transactions
          </Text>
        </View>
      ) : (
        <View>
          {recentTransactions.map((transaction, index) => (
            <View
              key={transaction.id}
              className={`flex-row justify-between items-center py-2 ${
                index < recentTransactions.length - 1
                  ? "border-b border-gray-100"
                  : ""
              }`}
            >
              <View className="flex-1 pr-3">
                <Text
                  className="text-sm text-gray-800 font-medium"
                  numberOfLines={1}
                >
                  {transaction.note}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {getFormattedDate(new Date(transaction.date))}
                </Text>
              </View>

              <View className="items-end">
                <Text
                  className={`text-sm font-semibold ${
                    // @ts-ignore - is_fully_compensated might not be in basic Transaction type
                    transaction.is_fully_compensated
                      ? "text-gray-400 line-through"
                      : transaction.type_name === "Income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                  numberOfLines={1}
                >
                  {transaction.type_name === "Income" ? "+" : "-"}
                  {getFormattedCurrency(
                    // @ts-ignore - remaining_amount might not be in basic Transaction type
                    transaction.remaining_amount ?? transaction.amount,
                    transaction.currency_symbol
                  )}
                </Text>
                {/* @ts-ignore - is_fully_compensated might not be in basic Transaction type */}
                {transaction.is_fully_compensated && (
                  <Text className="text-xs text-green-600 mt-0.5">
                    Compensated
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

RecentTransactionsWidget.displayName = "RecentTransactionsWidget";

export default RecentTransactionsWidget;
