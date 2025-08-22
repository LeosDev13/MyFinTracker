import { MemoryStick, Trash2, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../src/context';

const MemoryStatsViewer: React.FC = () => {
  const { getMemoryStats, cleanupMemory } = useApp();
  const [stats, setStats] = useState(getMemoryStats());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getMemoryStats());
    }, 5000); // Update every 5 seconds

    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [getMemoryStats]);

  const handleCleanup = () => {
    Alert.alert(
      'Clean Memory',
      `This will remove older transactions from memory (they\'ll still be in the database). Current usage: ${stats.memoryUsage}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          style: 'default',
          onPress: () => {
            cleanupMemory();
            setTimeout(() => setStats(getMemoryStats()), 100);
            Alert.alert('Success', 'Memory has been cleaned up!');
          },
        },
      ]
    );
  };

  const getMemoryColor = () => {
    const usage = parseInt(stats.memoryUsage.replace('%', ''));
    if (usage < 50) return 'text-green-600';
    if (usage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryBgColor = () => {
    const usage = parseInt(stats.memoryUsage.replace('%', ''));
    if (usage < 50) return 'bg-green-100';
    if (usage < 80) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <View className="mx-6 mb-5 bg-white rounded-xl p-6 shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <MemoryStick size={20} color="#6366F1" />
          <Text className="text-lg font-bold text-gray-900 ml-2">Memory Usage</Text>
        </View>

        <TouchableOpacity
          onPress={handleCleanup}
          className="flex-row items-center bg-indigo-100 px-3 py-2 rounded-lg"
        >
          <Trash2 size={16} color="#6366F1" />
          <Text className="text-indigo-700 font-medium ml-1 text-sm">Cleanup</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-sm text-gray-600 mb-4">
        Monitor transaction memory usage to ensure optimal performance
      </Text>

      {/* Memory Stats Grid */}
      <View className="space-y-4">
        {/* Usage Percentage */}
        <View className={`p-4 rounded-lg ${getMemoryBgColor()}`}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-gray-700">Memory Usage</Text>
            <Text className={`text-lg font-bold ${getMemoryColor()}`}>{stats.memoryUsage}</Text>
          </View>

          {/* Progress Bar */}
          <View className="w-full bg-gray-200 rounded-full h-2">
            <View
              className={`h-2 rounded-full ${
                parseInt(stats.memoryUsage.replace('%', '')) < 50
                  ? 'bg-green-500'
                  : parseInt(stats.memoryUsage.replace('%', '')) < 80
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{
                width: stats.memoryUsage,
              }}
            />
          </View>
        </View>

        {/* Transaction Count */}
        <View className="flex-row justify-between items-center p-4 bg-blue-50 rounded-lg">
          <View className="flex-row items-center">
            <TrendingUp size={16} color="#3B82F6" />
            <Text className="text-sm font-medium text-gray-700 ml-2">Transactions in Memory</Text>
          </View>
          <Text className="text-blue-700 font-bold">{stats.transactionCount.toLocaleString()}</Text>
        </View>

        {/* Limit Info */}
        <View className="flex-row justify-between items-center p-4 bg-gray-50 rounded-lg">
          <Text className="text-sm font-medium text-gray-700">Memory Limit</Text>
          <Text className="text-gray-900 font-bold">
            {stats.maxTransactions.toLocaleString()} transactions
          </Text>
        </View>
      </View>

      {/* Memory Tips */}
      <View className="mt-4 p-3 bg-indigo-50 rounded-lg">
        <Text className="text-indigo-800 font-medium text-sm mb-1">💡 Memory Tips</Text>
        <Text className="text-indigo-600 text-xs">
          • Memory usage above 80% may slow down the app{'\n'}• Cleanup removes older transactions
          from memory{'\n'}• All data remains safe in the database{'\n'}• Auto-cleanup happens at{' '}
          {stats.maxTransactions} transactions
        </Text>
      </View>

      {/* Refresh Info */}
      <Text className="text-gray-400 text-xs text-center mt-3">
        Stats refresh every 5 seconds • Development only
      </Text>
    </View>
  );
};

export default MemoryStatsViewer;
