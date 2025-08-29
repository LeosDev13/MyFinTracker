import { Settings, Target, X } from 'lucide-react-native';
import type React from 'react';
import { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useApp, useSettings } from '../../../src/context';
import type { WidgetProps } from '../../../src/types/widget';

const MonthlyBudgetWidget: React.FC<WidgetProps> = ({ widget, onRemove, onConfigure }) => {
  const { state } = useApp();
  const { getFormattedCurrency } = useSettings();

  // Get budget from widget config, default to 1000
  const budgetLimit = widget.config?.budgetLimit || 1000;

  const budgetData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate this month's expenses
    const thisMonthExpenses = (state?.transactions || [])
      .filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          t.type_name === 'Expense' &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + (t.remaining_amount ?? t.amount), 0);

    const percentage = budgetLimit > 0 ? Math.min((thisMonthExpenses / budgetLimit) * 100, 100) : 0;
    const remaining = Math.max(budgetLimit - thisMonthExpenses, 0);
    const isOverBudget = thisMonthExpenses > budgetLimit;

    return {
      spent: thisMonthExpenses,
      remaining,
      percentage,
      isOverBudget,
      budgetLimit,
    };
  }, [state.transactions, budgetLimit]);

  const getProgressColor = () => {
    if (budgetData.isOverBudget) return 'bg-red-500';
    if (budgetData.percentage > 80) return 'bg-orange-500';
    if (budgetData.percentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (budgetData.isOverBudget) return 'text-red-600';
    if (budgetData.percentage > 80) return 'text-orange-600';
    return 'text-gray-900';
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Target size={16} color="#6B7280" />
          <Text className="text-base font-bold text-gray-900 ml-2">{widget.title}</Text>
        </View>

        <View className="flex-row">
          {onConfigure && (
            <TouchableOpacity onPress={() => onConfigure(widget.id)} className="p-1 mr-1">
              <Settings size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
          {onRemove && (
            <TouchableOpacity onPress={() => onRemove(widget.id)} className="p-1">
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-gray-600">Monthly Budget</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {getFormattedCurrency(budgetData.budgetLimit)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="bg-gray-200 h-3 rounded-full overflow-hidden mb-2">
          <View
            className={`h-full rounded-full ${getProgressColor()}`}
            style={{ width: `${Math.min(budgetData.percentage, 100)}%` }}
          />
        </View>

        <View className="flex-row justify-between items-center">
          <View>
            <Text className={`text-sm font-semibold ${getTextColor()}`}>
              {getFormattedCurrency(budgetData.spent)} spent
            </Text>
            <Text className="text-xs text-gray-500">
              {budgetData.percentage.toFixed(1)}% of budget
            </Text>
          </View>

          <View className="items-end">
            {budgetData.isOverBudget ? (
              <>
                <Text className="text-sm font-semibold text-red-600">
                  {getFormattedCurrency(budgetData.spent - budgetData.budgetLimit)} over
                </Text>
                <Text className="text-xs text-red-500">Budget exceeded</Text>
              </>
            ) : (
              <>
                <Text className="text-sm font-semibold text-green-600">
                  {getFormattedCurrency(budgetData.remaining)} left
                </Text>
                <Text className="text-xs text-gray-500">Remaining</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {budgetData.isOverBudget && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-2">
          <Text className="text-xs text-red-700 text-center">
            ⚠️ You've exceeded your monthly budget. Consider reviewing your expenses.
          </Text>
        </View>
      )}
    </View>
  );
};

export default MonthlyBudgetWidget;
