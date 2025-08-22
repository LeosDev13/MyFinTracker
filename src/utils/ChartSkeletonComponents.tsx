import type React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export interface ChartSkeletonProps {
  height?: number;
  width?: number;
}

export interface ChartErrorFallbackProps {
  error?: string;
}

// Chart loading skeleton
export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height = 200, width }) => (
  <View className="bg-gray-100 rounded-lg items-center justify-center" style={{ height, width }}>
    <ActivityIndicator size="small" color="#1F5F43" />
    <Text className="text-gray-400 text-sm mt-2">Loading chart...</Text>
  </View>
);

// Chart error fallback
export const ChartErrorFallback: React.FC<ChartErrorFallbackProps> = ({ error }) => (
  <View className="bg-red-50 border border-red-200 rounded-lg p-4 items-center justify-center min-h-[150px]">
    <View className="items-center">
      <Text className="text-red-600 text-sm font-medium">Failed to load chart</Text>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  </View>
);
