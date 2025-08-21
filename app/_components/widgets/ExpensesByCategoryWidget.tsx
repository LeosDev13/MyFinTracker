import { X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useApp } from '../../../src/context';
import type { WidgetProps } from '../../../src/types/widget';

const ExpensesByCategoryWidget: React.FC<WidgetProps> = ({ widget, onRemove }) => {
  const { state } = useApp();

  // Calculate expenses by category (reuse logic from dashboard)
  const expenseData = useMemo(() => {
    const expenses = (state?.transactions || [])
      .filter((t) =>
        t.type_name === 'Expense' && t.remaining_amount !== undefined
          ? t.remaining_amount > 0
          : t.amount > 0
      )
      .reduce(
        (acc, transaction) => {
          const categoryName = transaction.category_name || 'Other';
          const amount = transaction.remaining_amount ?? transaction.amount;

          if (!acc[categoryName]) {
            acc[categoryName] = { amount: 0, color: '#BDC3C7' };
          }
          acc[categoryName].amount += amount;
          return acc;
        },
        {} as Record<string, { amount: number; color: string }>
      );

    // Get category colors from state
    (state?.categories || []).forEach((category) => {
      if (expenses[category.name]) {
        expenses[category.name].color = category.color;
      }
    });

    const total = Object.values(expenses).reduce((sum, item) => sum + item.amount, 0);

    if (total === 0) return [];

    return Object.entries(expenses)
      .map(([name, data]) => ({
        categoryName: name,
        categoryColor: data.color,
        amount: data.amount,
        percentage: Math.round((data.amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
  }, [state.transactions, state.categories]);

  const DonutChart = useMemo(() => {
    if (expenseData.length === 0) {
      return (
        <View className="items-center justify-center h-32">
          <Text className="text-gray-500 text-sm">No expense data</Text>
        </View>
      );
    }

    const size = 120;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    let cumulativePercentage = 0;

    return (
      <View className="flex-row items-center">
        <View className="items-center">
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              {expenseData.map((item, index) => {
                const strokeDasharray = `${(circumference * item.percentage) / 100} ${circumference}`;
                const strokeDashoffset = -((circumference * cumulativePercentage) / 100);
                cumulativePercentage += item.percentage;

                return (
                  <Circle
                    key={`${item.categoryName}-${index}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={item.categoryColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                  />
                );
              })}
            </G>
          </Svg>
        </View>

        <View className="ml-4 flex-1">
          {expenseData.slice(0, 3).map((item) => (
            <View key={item.categoryName} className="flex-row items-center mb-1">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.categoryColor }}
              />
              <Text className="text-xs text-gray-700 flex-1" numberOfLines={1}>
                {item.categoryName} ({item.percentage}%)
              </Text>
            </View>
          ))}
          {expenseData.length > 3 && (
            <Text className="text-xs text-gray-500 mt-1">+{expenseData.length - 3} more</Text>
          )}
        </View>
      </View>
    );
  }, [expenseData]);

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

      {DonutChart}
    </View>
  );
};

export default ExpensesByCategoryWidget;
