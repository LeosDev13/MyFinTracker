import { TrendingUp, X } from 'lucide-react-native';
import type React from 'react';
import { useMemo, Suspense } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { useApp, useSettings } from '../../../src/context';
import type { WidgetProps } from '../../../src/types/widget';
import {
  LazyLineChart,
  ChartSkeleton,
  ChartErrorFallback,
} from '../../../src/utils/ChartLazyLoader';

const screenWidth = Dimensions.get('window').width;

const BalanceTrendWidget: React.FC<WidgetProps> = ({ widget, onRemove }) => {
  const { state } = useApp();
  const { getFormattedCurrency } = useSettings();

  const chartData = useMemo(() => {
    if ((state?.transactions || []).length === 0) {
      return {
        labels: ['No data'],
        datasets: [
          {
            data: [0],
            color: (opacity = 1) => `rgba(34, 97, 64, ${opacity})`,
            strokeWidth: 2.5,
          },
        ],
      };
    }

    // Group transactions by date and calculate cumulative balance
    const sortedTransactions = [...(state?.transactions || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const dailyBalances: { [key: string]: number } = {};
    let cumulativeBalance = 0;

    sortedTransactions.forEach((transaction) => {
      const dateKey = new Date(transaction.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      // @ts-ignore - remaining_amount might not be in basic Transaction type
      const effectiveAmount =
        transaction.remaining_amount !== undefined
          ? transaction.remaining_amount
          : transaction.amount;
      const amount = transaction.type_name === 'Income' ? effectiveAmount : -effectiveAmount;
      cumulativeBalance += amount;
      dailyBalances[dateKey] = cumulativeBalance;
    });

    const dates = Object.keys(dailyBalances);
    const balances = Object.values(dailyBalances);

    // Take last 7 data points for the chart
    const lastSevenDates = dates.slice(-7);
    const lastSevenBalances = balances.slice(-7);

    return {
      labels: lastSevenDates.length > 0 ? lastSevenDates : ['No data'],
      datasets: [
        {
          data: lastSevenBalances.length > 0 ? lastSevenBalances : [0],
          color: (opacity = 1) => `rgba(34, 97, 64, ${opacity})`,
          strokeWidth: 2.5,
        },
      ],
    };
  }, [state.transactions]);

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      color: (opacity = 1) => `rgba(34, 97, 64, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
      propsForDots: {
        r: '3.5',
        strokeWidth: '2',
        stroke: '#226140',
        fill: '#226140',
      },
      propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: '#E5E7EB',
        strokeWidth: 0.8,
      },
      propsForLabels: {
        fontSize: 10,
        fontWeight: '400',
        color: '#374151',
      },
      propsForVerticalLabels: {
        fontSize: 10,
        fontWeight: '400',
        color: '#374151',
      },
    }),
    []
  );

  const balanceStats = useMemo(() => {
    const balances = chartData.datasets[0].data;
    if (balances.length < 2) return null;

    const currentBalance = balances[balances.length - 1];
    const previousBalance = balances[balances.length - 2];
    const change = currentBalance - previousBalance;
    const percentageChange = previousBalance !== 0 ? (change / Math.abs(previousBalance)) * 100 : 0;

    return {
      current: currentBalance,
      change,
      percentageChange,
      isPositive: change >= 0,
    };
  }, [chartData]);

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <TrendingUp size={16} color="#6B7280" />
          <Text className="text-base font-bold text-gray-900 ml-2">{widget.title}</Text>
        </View>
        {onRemove && (
          <TouchableOpacity onPress={() => onRemove(widget.id)} className="p-1">
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {balanceStats && (
        <View className="mb-3">
          <Text className="text-lg font-bold text-gray-900">
            {getFormattedCurrency(balanceStats.current)}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text
              className={`text-sm font-medium ${
                balanceStats.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {balanceStats.isPositive ? '+' : ''}
              {getFormattedCurrency(balanceStats.change)}({balanceStats.percentageChange.toFixed(1)}
              %)
            </Text>
            <Text className="text-xs text-gray-500 ml-2">vs last period</Text>
          </View>
        </View>
      )}

      <View className="-mx-2">
        <Suspense fallback={<ChartSkeleton height={140} width={screenWidth - 64} />}>
          <LazyLineChart
            data={chartData}
            width={screenWidth - 64}
            height={140}
            chartConfig={chartConfig}
            bezier={false}
            style={{
              borderRadius: 0,
              marginLeft: -8,
            }}
            withDots={true}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={false}
            segments={3}
            yAxisInterval={1}
          />
        </Suspense>
      </View>
    </View>
  );
};

export default BalanceTrendWidget;
