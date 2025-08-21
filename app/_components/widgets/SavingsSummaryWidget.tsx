import { PiggyBank, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useApp, useSettings } from '../../../src/context';
import type { WidgetProps } from '../../../src/types/widget';

const SavingsSummaryWidget: React.FC<WidgetProps> = ({ widget, onRemove }) => {
  const { state } = useApp();
  const { getFormattedCurrency } = useSettings();

  const savingsData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter savings transactions for current month
    const thisMonthSavings = (state?.transactions || []).filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.type_name === 'Savings' &&
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    // Calculate monthly savings amount
    const monthlySavings = thisMonthSavings.reduce(
      (sum, t) => sum + (t.remaining_amount ?? t.amount),
      0
    );

    // Calculate total savings (all time)
    const totalSavings = (state?.transactions || [])
      .filter((t) => t.type_name === 'Savings')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    // Get recent savings transactions (last 3)
    const recentSavings = thisMonthSavings
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    return {
      monthlySavings,
      totalSavings,
      recentSavings,
      transactionCount: thisMonthSavings.length,
    };
  }, [state?.transactions]);

  if (savingsData.totalSavings === 0) {
    return (
      <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-gray-900">{widget.title}</Text>
          {onRemove && (
            <TouchableOpacity onPress={() => onRemove(widget.id)} className="p-1">
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <View className="items-center justify-center py-8">
          <PiggyBank size={48} color="#D1D5DB" />
          <Text className="text-gray-500 text-center text-sm mt-2">No savings yet</Text>
          <Text className="text-gray-400 text-center text-xs mt-1">
            Start saving to see your progress here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-gray-900">{widget.title}</Text>
        {onRemove && (
          <TouchableOpacity onPress={() => onRemove(widget.id)} className="p-1">
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Savings Summary Cards */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 bg-purple-50 rounded-lg p-3 mr-2">
          <View className="flex-row items-center mb-1">
            <PiggyBank size={16} color="#7C3AED" />
            <Text className="text-xs text-purple-600 ml-1 font-medium">This Month</Text>
          </View>
          <Text className="text-lg font-bold text-purple-700">
            {getFormattedCurrency(savingsData.monthlySavings)}
          </Text>
          <Text className="text-xs text-purple-500">
            {savingsData.transactionCount} transaction
            {savingsData.transactionCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <View className="flex-1 bg-green-50 rounded-lg p-3 ml-2">
          <View className="flex-row items-center mb-1">
            <PiggyBank size={16} color="#16A34A" />
            <Text className="text-xs text-green-600 ml-1 font-medium">Total</Text>
          </View>
          <Text className="text-lg font-bold text-green-700">
            {getFormattedCurrency(savingsData.totalSavings)}
          </Text>
          <Text className="text-xs text-green-500">All time</Text>
        </View>
      </View>

      {/* Recent Savings */}
      {savingsData.recentSavings.length > 0 && (
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Recent Savings</Text>
          {savingsData.recentSavings.map((saving, index) => (
            <View
              key={saving.id}
              className={`flex-row justify-between items-center py-2 ${
                index < savingsData.recentSavings.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm text-gray-800 font-medium" numberOfLines={1}>
                  {saving.note}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {new Date(saving.date).toLocaleDateString()}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-purple-600">
                {getFormattedCurrency(
                  saving.remaining_amount ?? saving.amount,
                  saving.currency_symbol
                )}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default SavingsSummaryWidget;
