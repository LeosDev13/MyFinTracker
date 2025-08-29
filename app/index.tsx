import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { useApp, useWidgets } from '../src/context';
import { BalanceCard } from './_components/balanceCard';
import LazyWidget from './_components/LazyWidget';

const DashboardScreen = () => {
  const { state, refreshAll } = useApp();
  const { state: widgetState, removeWidget } = useWidgets();

  const { balance, totalIncome, totalExpenses, totalSavings, refreshing } = state;

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  const handleRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const activeWidgets = useMemo(() => {
    // Only return widgets if the widget context is initialized
    if (!widgetState.isInitialized) return [];

    return widgetState.widgets
      .filter((widget) => widget.isActive)
      .sort((a, b) => a.order - b.order);
  }, [widgetState.widgets, widgetState.isInitialized]);

  const renderWidget = useCallback(
    (widget: (typeof widgetState.widgets)[0]) => {
      return (
        <LazyWidget
          key={widget.id}
          type={widget.type}
          widget={widget}
          onRemove={(widgetId) => removeWidget(widgetId)}
        />
      );
    },
    [removeWidget]
  );

  return (
    <View className="flex-1 bg-soft-pink">
      <StatusBar barStyle="dark-content" className="bg-soft-pink" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1F5F43"
            colors={['#1F5F43']}
          />
        }
      >
        <View className="px-6 pt-14 pb-5">
          <Text className="text-3xl font-bold text-gray-900 mb-0.5">MyFinTracker</Text>
        </View>

        <View className="px-6 mb-5">
          <View className="flex-row justify-between mb-3" style={{ gap: 8 }}>
            <BalanceCard backgroundColor="#B8D4B8" moneyBalance={balance} text="Balance" />

            <BalanceCard backgroundColor="#D8E8D8" moneyBalance={totalIncome} text="Income" />
          </View>

          <View className="flex-row justify-between" style={{ gap: 8 }}>
            <BalanceCard backgroundColor="#E8B4C8" moneyBalance={totalExpenses} text="Expenses" />

            <BalanceCard backgroundColor="#E6D7FF" moneyBalance={totalSavings} text="Saved" />
          </View>
        </View>

        {/* Dynamic Widgets */}
        <View className="px-6">{activeWidgets.map(renderWidget)}</View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;
