import type React from 'react';
import { lazy } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

// Lazy load heavy screens for better initial load performance
// These screens contain complex logic, charts, or heavy dependencies

export const LazySettingsScreen = lazy(() => import('../settings'));
export const LazyTransactionsScreen = lazy(() => import('../transactions'));
export const LazyWidgetManagementScreen = lazy(() => import('../widgetManagement'));

// Lightweight loading component for screen transitions
export const ScreenSkeleton: React.FC = () => (
  <View className="flex-1 bg-soft-pink justify-center items-center">
    <ActivityIndicator size="large" color="#1F5F43" />
    <Text className="text-gray-600 text-lg mt-4">Loading screen...</Text>
  </View>
);
