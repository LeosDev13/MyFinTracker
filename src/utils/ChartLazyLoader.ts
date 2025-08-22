/**
 * Chart Lazy Loader
 * Dynamically imports chart components to reduce initial bundle size
 * Charts are heavy dependencies that should only load when needed
 */
import { lazy } from "react";

// Chart component types for better type safety
export type ChartType = "line" | "pie" | "bar";

// Lazy load chart libraries only when needed
export const LazyLineChart = lazy(async () => {
  const { LineChart } = await import("react-native-chart-kit");
  return { default: LineChart };
});

export const LazyPieChart = lazy(async () => {
  const { PieChart } = await import("react-native-gifted-charts");
  return { default: PieChart };
});

export const LazyBarChart = lazy(async () => {
  const { BarChart } = await import("react-native-gifted-charts");
  return { default: BarChart };
});

// Chart component types for better type safety
export interface ChartSkeletonProps {
  height?: number;
  width?: number;
}

export interface ChartErrorFallbackProps {
  error?: string;
}

// Re-export skeleton components from the .tsx file
export { ChartErrorFallback, ChartSkeleton } from "./ChartSkeletonComponents";

/**
 * Preloads chart components if user is likely to view them
 * Can be called when user navigates to dashboard or analytics sections
 */
export async function preloadCharts(): Promise<void> {
  try {
    // Preload most commonly used charts
    await Promise.allSettled([
      import("react-native-chart-kit"),
      import("react-native-gifted-charts"),
    ]);
    console.log("✅ Chart libraries preloaded");
  } catch (error) {
    console.error("Failed to preload chart libraries:", error);
  }
}

/**
 * Chart configuration for consistent styling
 */
export const CHART_DEFAULTS = {
  colors: {
    primary: "#1F5F43",
    secondary: "#C4D7C0",
    accent: "#E4BDB7",
    background: "#F5EDE5",
    text: "#1C2B2E",
  },
  dimensions: {
    width: 280,
    height: 200,
  },
  style: {
    marginVertical: 8,
    borderRadius: 16,
  },
} as const;
