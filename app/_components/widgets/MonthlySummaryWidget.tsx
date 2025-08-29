import { Calendar, X } from 'lucide-react-native';
import type React from 'react';
import { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useApp, useSettings } from '../../../src/context';
import type { WidgetProps } from '../../../src/types/widget';

const MonthlySummaryWidget: React.FC<WidgetProps> = ({ widget, onRemove }) => {
  const { state } = useApp();
  const { getFormattedCurrency } = useSettings();

  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();

    // Filter transactions for current month
    const thisMonthTransactions = (state?.transactions || []).filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
      );
    });

    // Calculate totals
    const totalIncome = thisMonthTransactions
      .filter((t) => t.type_name === 'Income')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    const totalExpenses = thisMonthTransactions
      .filter((t) => t.type_name === 'Expense')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    // Calculate averages
    const avgDailyIncome = currentDay > 0 ? totalIncome / currentDay : 0;
    const avgDailyExpenses = currentDay > 0 ? totalExpenses / currentDay : 0;

    // Projections for end of month
    const projectedIncome = (totalIncome / currentDay) * daysInMonth;
    const projectedExpenses = (totalExpenses / currentDay) * daysInMonth;

    // Transaction counts
    const incomeTransactionCount = thisMonthTransactions.filter(
      (t) => t.type_name === 'Income'
    ).length;
    const expenseTransactionCount = thisMonthTransactions.filter(
      (t) => t.type_name === 'Expense'
    ).length;

    // Top spending category
    const expensesByCategory = thisMonthTransactions
      .filter((t) => t.type_name === 'Expense' && t.category_name)
      .reduce(
        (acc, t) => {
          const category = t.category_name!;
          acc[category] = (acc[category] || 0) + (t.remaining_amount ?? t.amount);
          return acc;
        },
        {} as Record<string, number>
      );

    const topCategory = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0];

    return {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      avgDailyIncome,
      avgDailyExpenses,
      projectedIncome,
      projectedExpenses,
      projectedNet: projectedIncome - projectedExpenses,
      incomeTransactionCount,
      expenseTransactionCount,
      totalTransactionCount: thisMonthTransactions.length,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      currentDay,
      daysInMonth,
      monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, [state.transactions]);

  const StatCard = ({
    label,
    value,
    color = 'text-gray-900',
    subValue,
  }: {
    label: string;
    value: string;
    color?: string;
    subValue?: string;
  }) => (
    <View className="bg-gray-50 rounded-lg p-3 flex-1">
      <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      <Text
        className={`text-base font-bold ${color}`}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {value}
      </Text>
      {subValue && <Text className="text-xs text-gray-400 mt-1">{subValue}</Text>}
    </View>
  );

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Calendar size={16} color="#6B7280" />
          <Text className="text-base font-bold text-gray-900 ml-2">{widget.title}</Text>
        </View>
        {onRemove && (
          <TouchableOpacity onPress={() => onRemove(widget.id)} className="p-1">
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Month Progress */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-medium text-gray-700">{monthlyData.monthName}</Text>
          <Text className="text-sm text-gray-500">
            Day {monthlyData.currentDay} of {monthlyData.daysInMonth}
          </Text>
        </View>

        <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
          <View
            className="bg-[#1F5F43] h-full rounded-full"
            style={{
              width: `${(monthlyData.currentDay / monthlyData.daysInMonth) * 100}%`,
            }}
          />
        </View>
      </View>

      {/* Current Totals */}
      <View className="flex-row gap-2 mb-3">
        <StatCard
          label="Total Income"
          value={getFormattedCurrency(monthlyData.totalIncome)}
          color="text-green-600"
        />
        <StatCard
          label="Total Expenses"
          value={getFormattedCurrency(monthlyData.totalExpenses)}
          color="text-red-600"
        />
      </View>

      <View className="flex-row gap-2 mb-3">
        <StatCard
          label="Net Balance"
          value={getFormattedCurrency(Math.abs(monthlyData.net))}
          color={monthlyData.net >= 0 ? 'text-green-600' : 'text-red-600'}
          subValue={monthlyData.net >= 0 ? 'Saved' : 'Overspent'}
        />
        <StatCard
          label="Transactions"
          value={monthlyData.totalTransactionCount.toString()}
          subValue={`${monthlyData.incomeTransactionCount}↗ ${monthlyData.expenseTransactionCount}↘`}
        />
      </View>

      {/* Projections */}
      <View className="bg-blue-50 rounded-lg p-3 mb-3">
        <Text className="text-sm font-medium text-blue-900 mb-2">End of Month Projections</Text>
        <View className="flex-row justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-xs text-blue-600">Projected Net</Text>
            <Text
              className={`text-base font-bold ${
                monthlyData.projectedNet >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {getFormattedCurrency(Math.abs(monthlyData.projectedNet))}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-blue-600">Daily Avg Expenses</Text>
            <Text className="text-base font-bold text-gray-900">
              {getFormattedCurrency(monthlyData.avgDailyExpenses)}
            </Text>
          </View>
        </View>
      </View>

      {/* Top Category */}
      {monthlyData.topCategory && (
        <View className="bg-orange-50 rounded-lg p-3">
          <Text className="text-sm font-medium text-orange-900 mb-1">Top Spending Category</Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-orange-700 font-medium">
              {monthlyData.topCategory.name}
            </Text>
            <Text className="text-sm font-bold text-orange-900">
              {getFormattedCurrency(monthlyData.topCategory.amount)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default MonthlySummaryWidget;
