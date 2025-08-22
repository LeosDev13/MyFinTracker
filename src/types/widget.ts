import React from "react";

export type WidgetType =
  | "expenses-by-category"
  | "balance-trend"
  | "monthly-budget"
  | "income-vs-expenses"
  | "recent-transactions"
  | "monthly-summary"
  | "quick-stats"
  | "savings-summary";

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
  order: number;
  config?: Record<string, any>;
}

export interface WidgetConfig {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultActive: boolean;
  component: React.ComponentType<WidgetProps>;
}

export interface WidgetProps {
  widget: Widget;
  onRemove?: (widgetId: string) => Promise<void> | void;
  onConfigure?: (widgetId: string) => void;
}

// Import widget components
import BalanceTrendWidget from "../../app/_components/widgets/BalanceTrendWidget";
import ExpensesByCategoryWidget from "../../app/_components/widgets/ExpensesByCategoryWidget";
import IncomeVsExpensesWidget from "../../app/_components/widgets/IncomeVsExpensesWidget";
import MonthlyBudgetWidget from "../../app/_components/widgets/MonthlyBudgetWidget";
import MonthlySummaryWidget from "../../app/_components/widgets/MonthlySummaryWidget";
import QuickStatsWidget from "../../app/_components/widgets/QuickStatsWidget";
import RecentTransactionsWidget from "../../app/_components/widgets/RecentTransactionsWidget";
import SavingsSummaryWidget from "../../app/_components/widgets/SavingsSummaryWidget";

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    type: "expenses-by-category",
    title: "Expenses by Category",
    description: "Visual breakdown of your expenses by category",
    icon: "pie-chart",
    defaultActive: true,
    component: ExpensesByCategoryWidget,
  },
  {
    type: "recent-transactions",
    title: "Recent Transactions",
    description: "List of your latest transactions",
    icon: "clock",
    defaultActive: true,
    component: RecentTransactionsWidget,
  },
  {
    type: "quick-stats",
    title: "Quick Stats",
    description: "Key metrics at a glance",
    icon: "zap",
    defaultActive: false,
    component: QuickStatsWidget,
  },
  {
    type: "monthly-budget",
    title: "Monthly Budget",
    description: "Progress towards your monthly spending goal",
    icon: "target",
    defaultActive: false,
    component: MonthlyBudgetWidget,
  },
  {
    type: "balance-trend",
    title: "Balance Trend",
    description: "Evolution of your balance over time",
    icon: "trending-up",
    defaultActive: false,
    component: BalanceTrendWidget,
  },
  {
    type: "income-vs-expenses",
    title: "Income vs Expenses",
    description: "Visual comparison of income and expenses",
    icon: "bar-chart-3",
    defaultActive: false,
    component: IncomeVsExpensesWidget,
  },
  {
    type: "monthly-summary",
    title: "Monthly Summary",
    description: "Statistics for the current period",
    icon: "calendar",
    defaultActive: false,
    component: MonthlySummaryWidget,
  },
  {
    type: "savings-summary",
    title: "Savings Summary",
    description: "Track your monthly and total savings progress",
    icon: "piggy-bank",
    defaultActive: false,
    component: SavingsSummaryWidget,
  },
];
