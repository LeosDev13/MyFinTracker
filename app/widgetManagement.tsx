import { router } from 'expo-router';
import { ArrowLeft, Check, Plus, Settings, Trash2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useWidgets } from '../src/context';
import type { WidgetType } from '../src/types/widget';
import { AVAILABLE_WIDGETS } from '../src/types/widget';

const WidgetManagementScreen = () => {
  const { state, addWidget, removeWidget, toggleWidget } = useWidgets();
  const [activeTab, setActiveTab] = useState<'active' | 'available'>('active');

  // Get active widgets
  const activeWidgets = useMemo(() => {
    return state.widgets.filter((widget) => widget.isActive).sort((a, b) => a.order - b.order);
  }, [state.widgets]);

  // Get available widgets (not yet added)
  const availableWidgets = useMemo(() => {
    return AVAILABLE_WIDGETS.filter((config) => {
      return !state.widgets.some((w) => w.type === config.type);
    });
  }, [state.widgets]);

  // Get inactive widgets (added but disabled)
  const inactiveWidgets = useMemo(() => {
    return state.widgets.filter((widget) => !widget.isActive).sort((a, b) => a.order - b.order);
  }, [state.widgets]);

  const handleAddWidget = async (type: WidgetType) => {
    try {
      await addWidget(type);
    } catch (_error) {
      Alert.alert('Error', 'Failed to add widget');
    }
  };

  const handleRemoveWidget = (widgetId: string, title: string) => {
    Alert.alert('Remove Widget', `Are you sure you want to remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeWidget(widgetId);
          } catch (_error) {
            Alert.alert('Error', 'Failed to remove widget');
          }
        },
      },
    ]);
  };

  const handleToggleWidget = async (widgetId: string) => {
    try {
      await toggleWidget(widgetId);
    } catch (_error) {
      Alert.alert('Error', 'Failed to toggle widget');
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconProps = { size: 20, color: '#6B7280' };
    switch (iconName) {
      case 'pie-chart':
        return <Settings {...iconProps} />;
      case 'trending-up':
        return <Settings {...iconProps} />;
      case 'target':
        return <Settings {...iconProps} />;
      case 'bar-chart-3':
        return <Settings {...iconProps} />;
      case 'clock':
        return <Settings {...iconProps} />;
      case 'calendar':
        return <Settings {...iconProps} />;
      case 'zap':
        return <Settings {...iconProps} />;
      default:
        return <Settings {...iconProps} />;
    }
  };

  const renderActiveWidget = ({ item }: { item: (typeof activeWidgets)[0] }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="mr-3">{getIconComponent(item.icon)}</View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">{item.title}</Text>
            <Text className="text-sm text-gray-600">{item.description}</Text>
          </View>
        </View>
        <View className="flex-row items-center ml-3">
          <TouchableOpacity
            onPress={() => handleToggleWidget(item.id)}
            className="p-2 mr-2 bg-orange-100 rounded-full"
          >
            <X size={16} color="#EA580C" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemoveWidget(item.id, item.title)}
            className="p-2 bg-red-100 rounded-full"
          >
            <Trash2 size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderInactiveWidget = ({ item }: { item: (typeof inactiveWidgets)[0] }) => (
    <View className="bg-gray-50 rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="mr-3">{getIconComponent(item.icon)}</View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-600">{item.title}</Text>
            <Text className="text-sm text-gray-500">{item.description}</Text>
          </View>
        </View>
        <View className="flex-row items-center ml-3">
          <TouchableOpacity
            onPress={() => handleToggleWidget(item.id)}
            className="p-2 mr-2 bg-green-100 rounded-full"
          >
            <Check size={16} color="#16A34A" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemoveWidget(item.id, item.title)}
            className="p-2 bg-red-100 rounded-full"
          >
            <Trash2 size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAvailableWidget = ({ item }: { item: (typeof availableWidgets)[0] }) => (
    <TouchableOpacity
      onPress={() => handleAddWidget(item.type)}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="mr-3">{getIconComponent(item.icon)}</View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">{item.title}</Text>
            <Text className="text-sm text-gray-600">{item.description}</Text>
          </View>
        </View>
        <View className="ml-3 bg-[#1F5F43] px-4 py-2 rounded-full">
          <Plus size={16} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#F5EDE5]">
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE5" />

      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 bg-white rounded-full shadow-sm"
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Widget Management</Text>
          <View className="w-10" />
        </View>

        {/* Tab Navigation */}
        <View className="flex-row bg-white rounded-xl p-1 shadow-sm">
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-lg ${
              activeTab === 'active' ? 'bg-[#1F5F43]' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === 'active' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Active ({activeWidgets.length + inactiveWidgets.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('available')}
            className={`flex-1 py-2 px-4 rounded-lg ${
              activeTab === 'available' ? 'bg-[#1F5F43]' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === 'available' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Available ({availableWidgets.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'active' ? (
          <View>
            {/* Active Widgets */}
            {activeWidgets.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">
                  Active Widgets ({activeWidgets.length})
                </Text>
                <FlatList
                  data={activeWidgets}
                  renderItem={renderActiveWidget}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Inactive Widgets */}
            {inactiveWidgets.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">
                  Inactive Widgets ({inactiveWidgets.length})
                </Text>
                <Text className="text-sm text-gray-600 mb-3">
                  These widgets are added but not shown on your dashboard
                </Text>
                <FlatList
                  data={inactiveWidgets}
                  renderItem={renderInactiveWidget}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {activeWidgets.length === 0 && inactiveWidgets.length === 0 && (
              <View className="items-center justify-center py-12">
                <Text className="text-gray-500 text-center text-base">No widgets added yet.</Text>
                <Text className="text-gray-400 text-center text-sm mt-1">
                  Go to Available tab to add widgets
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Available Widgets ({availableWidgets.length})
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Tap on any widget to add it to your dashboard
            </Text>

            {availableWidgets.length > 0 ? (
              <FlatList
                data={availableWidgets}
                renderItem={renderAvailableWidget}
                keyExtractor={(item) => item.type}
                scrollEnabled={false}
              />
            ) : (
              <View className="items-center justify-center py-12">
                <Text className="text-gray-500 text-center text-base">
                  All widgets have been added!
                </Text>
                <Text className="text-gray-400 text-center text-sm mt-1">
                  Check the Active tab to manage your widgets
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default WidgetManagementScreen;
