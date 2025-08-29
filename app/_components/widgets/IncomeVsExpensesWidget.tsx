import { BarChart3, X } from 'lucide-react-native';
import type React from 'react';
import { useMemo } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useApp, useSettings } from '../../../src/context';
import type { WidgetProps } from '../../../src/types/widget';

const screenWidth = Dimensions.get('window').width;

const IncomeVsExpensesWidget: React.FC<WidgetProps> = ({ widget, onRemove }) => {
  const { state } = useApp();
  const { getFormattedCurrency } = useSettings();

  const chartData = useMemo(() => {
    if ((state?.transactions || []).length === 0) {
      return {
        labels: ['This Month'],
        datasets: [
          {
            data: [0, 0],
            colors: [
              (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Income - green
              (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Expenses - red
            ],
          },
        ],
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate current month income and expenses
    const thisMonthTransactions = (state?.transactions || []).filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
      );
    });

    const monthlyIncome = thisMonthTransactions
      .filter((t) => t.type_name === 'Income')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    const monthlyExpenses = thisMonthTransactions
      .filter((t) => t.type_name === 'Expense')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    // Get previous month for comparison
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthTransactions = state.transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === prevMonth && transactionDate.getFullYear() === prevYear;
    });

    const lastMonthIncome = lastMonthTransactions
      .filter((t) => t.type_name === 'Income')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    const lastMonthExpenses = lastMonthTransactions
      .filter((t) => t.type_name === 'Expense')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    return {
      labels: ['Last Month', 'This Month'],
      datasets: [
        {
          data: [lastMonthIncome, monthlyIncome, lastMonthExpenses, monthlyExpenses],
          colors: [
            (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Income - green
            (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Income - green
            (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Expenses - red
            (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Expenses - red
          ],
        },
      ],
    };
  }, [state.transactions]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthTransactions = state.transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
      );
    });

    const income = thisMonthTransactions
      .filter((t) => t.type_name === 'Income')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    const expenses = thisMonthTransactions
      .filter((t) => t.type_name === 'Expense')
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    const net = income - expenses;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    return { income, expenses, net, savingsRate };
  }, [state.transactions]);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: true,
    propsForLabels: {
      fontSize: 10,
      fontWeight: '400',
      color: '#374151',
    },
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <BarChart3 size={16} color="#6B7280" />
          <Text className="text-base font-bold text-gray-900 ml-2">{widget.title}</Text>
        </View>
        {onRemove && (
          <TouchableOpacity onPress={() => onRemove(widget.id)} className="p-1">
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Current Month Stats */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-xs text-gray-500 mb-1">Income</Text>
          <Text className="text-lg font-bold text-green-600">
            {getFormattedCurrency(monthlyStats.income)}
          </Text>
        </View>
        <View className="flex-1 mx-2">
          <Text className="text-xs text-gray-500 mb-1">Expenses</Text>
          <Text className="text-lg font-bold text-red-600">
            {getFormattedCurrency(monthlyStats.expenses)}
          </Text>
        </View>
        <View className="flex-1 ml-2">
          <Text className="text-xs text-gray-500 mb-1">Net</Text>
          <Text
            className={`text-lg font-bold ${
              monthlyStats.net >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {getFormattedCurrency(Math.abs(monthlyStats.net))}
          </Text>
        </View>
      </View>

      {/* Savings Rate */}
      <View className="bg-gray-50 rounded-lg p-3 mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Savings Rate This Month</Text>
        <Text
          className={`text-xl font-bold ${
            monthlyStats.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {monthlyStats.savingsRate.toFixed(1)}%
        </Text>
        {monthlyStats.savingsRate < 0 && (
          <Text className="text-xs text-red-500 mt-1">You're spending more than you earn</Text>
        )}
      </View>

      {/* Chart */}
      <View className="-mx-2">
        <BarChart
          data={chartData}
          width={screenWidth - 64}
          height={120}
          chartConfig={chartConfig}
          style={{
            borderRadius: 0,
            marginLeft: -8,
          }}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          fromZero={true}
          segments={3}
          yAxisSuffix=""
          showBarTops={false}
        />
      </View>

      {/* Legend */}
      <View className="flex-row justify-center mt-3">
        <View className="flex-row items-center mr-4">
          <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
          <Text className="text-xs text-gray-600">Income</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
          <Text className="text-xs text-gray-600">Expenses</Text>
        </View>
      </View>
    </View>
  );
};

export default IncomeVsExpensesWidget;
