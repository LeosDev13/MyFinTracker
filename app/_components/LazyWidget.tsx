import type React from 'react';
import { lazy, Suspense } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { Widget, WidgetType } from '../../src/types/widget';

interface LazyWidgetProps {
  type: WidgetType;
  widget: Widget;
  onRemove: () => void;
  [key: string]: unknown;
}

// Lazy load widget components for better code splitting
const BalanceTrendWidget = lazy(() => import('./widgets/BalanceTrendWidget'));
const ExpensesByCategoryWidget = lazy(() => import('./widgets/ExpensesByCategoryWidget'));
const IncomeVsExpensesWidget = lazy(() => import('./widgets/IncomeVsExpensesWidget'));
const MonthlyBudgetWidget = lazy(() => import('./widgets/MonthlyBudgetWidget'));
const MonthlySummaryWidget = lazy(() => import('./widgets/MonthlySummaryWidget'));
const QuickStatsWidget = lazy(() => import('./widgets/QuickStatsWidget'));
const RecentTransactionsWidget = lazy(() => import('./widgets/RecentTransactionsWidget'));
const SavingsSummaryWidget = lazy(() => import('./widgets/SavingsSummaryWidget'));

// Lightweight loading fallback
const WidgetSkeleton: React.FC<{ height?: number }> = ({ height = 200 }) => (
  <View
    className="bg-white rounded-xl p-6 shadow-sm mx-4 mb-5 items-center justify-center"
    style={{ height }}
  >
    <ActivityIndicator size="small" color="#1F5F43" />
    <Text className="text-gray-500 text-sm mt-2">Loading widget...</Text>
  </View>
);

// Error boundary for widget loading failures
const WidgetErrorFallback: React.FC<{ error?: string }> = ({ error }) => (
  <View className="bg-red-50 rounded-xl p-6 shadow-sm mx-4 mb-5 items-center justify-center min-h-[150px]">
    <Text className="text-red-600 text-sm font-medium">Failed to load widget</Text>
    {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
  </View>
);

const LazyWidget: React.FC<LazyWidgetProps> = ({ type, ...props }) => {
  console.log('LazyWidget rendering:', type, 'props:', Object.keys(props));

  const renderWidget = () => {
    switch (type) {
      case 'balance-trend':
        return <BalanceTrendWidget {...props} />;
      case 'expenses-by-category':
        return <ExpensesByCategoryWidget {...props} />;
      case 'income-vs-expenses':
        return <IncomeVsExpensesWidget {...props} />;
      case 'monthly-budget':
        return <MonthlyBudgetWidget {...props} />;
      case 'monthly-summary':
        return <MonthlySummaryWidget {...props} />;
      case 'quick-stats':
        return <QuickStatsWidget {...props} />;
      case 'recent-transactions':
        console.log('Rendering RecentTransactionsWidget');
        return <RecentTransactionsWidget {...props} />;
      case 'savings-summary':
        return <SavingsSummaryWidget {...props} />;
      default:
        console.log('Unknown widget type:', type);
        return <WidgetErrorFallback error={`Unknown widget type: ${type}`} />;
    }
  };

  return <Suspense fallback={<WidgetSkeleton />}>{renderWidget()}</Suspense>;
};

export default LazyWidget;
