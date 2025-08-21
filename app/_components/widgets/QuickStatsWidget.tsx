import { Calendar, DollarSign, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useApp, useSettings } from '../../../src/context';
import type { WidgetProps } from '../../../src/types/widget';

const QuickStatsWidget: React.FC<WidgetProps> = ({ widget, onRemove }) => {
  const { state } = useApp();
  const { getFormattedCurrency } = useSettings();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter transactions for current month
    const thisMonthTransactions = (state?.transactions || []).filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
      );
    });

    // Calculate monthly stats
    const monthlyIncome = thisMonthTransactions
      .filter((t) => t.type_name === 'Income')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    const monthlyExpenses = thisMonthTransactions
      .filter((t) => t.type_name === 'Expense')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    // Calculate daily average (based on current day of month)
    const dayOfMonth = now.getDate();
    const avgDailyExpenses = dayOfMonth > 0 ? monthlyExpenses / dayOfMonth : 0;

    // Transaction count this month
    const monthlyTransactionCount = thisMonthTransactions.length;

    return {
      monthlyIncome,
      monthlyExpenses,
      avgDailyExpenses,
      monthlyTransactionCount,
      monthlyNet: monthlyIncome - monthlyExpenses,
    };
  }, [state.transactions]);

  const StatItem = ({
    icon,
    label,
    value,
    color = 'text-gray-900',
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color?: string;
  }) => (
    <View className="flex-1 items-center py-2">
      <View className="mb-1">{icon}</View>
      <Text className="text-xs text-gray-500 text-center mb-1" numberOfLines={1}>
        {label}
      </Text>
      <Text
        className={`text-sm font-bold text-center ${color}`}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {value}
      </Text>
    </View>
  );

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

      <View className="flex-row justify-between">
        <StatItem
          icon={<TrendingUp size={16} color="#16A34A" />}
          label="Monthly Income"
          value={getFormattedCurrency(stats.monthlyIncome)}
          color="text-green-600"
        />

        <StatItem
          icon={<TrendingDown size={16} color="#DC2626" />}
          label="Monthly Expenses"
          value={getFormattedCurrency(stats.monthlyExpenses)}
          color="text-red-600"
        />
      </View>

      <View className="flex-row justify-between mt-2">
        <StatItem
          icon={<DollarSign size={16} color="#6B7280" />}
          label="Daily Avg"
          value={getFormattedCurrency(stats.avgDailyExpenses)}
        />

        <StatItem
          icon={<Calendar size={16} color="#6B7280" />}
          label="Transactions"
          value={stats.monthlyTransactionCount.toString()}
        />
      </View>

      <View className="mt-2 pt-3 border-t border-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-700">Monthly Net:</Text>
          <Text
            className={`text-sm font-bold ${
              stats.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {getFormattedCurrency(Math.abs(stats.monthlyNet))}
            {stats.monthlyNet >= 0 ? ' saved' : ' overspent'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default QuickStatsWidget;
