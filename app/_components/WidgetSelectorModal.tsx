import {
  BarChart3,
  Calendar,
  Clock,
  PieChart,
  PiggyBank,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react-native';
import React from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View, type ListRenderItem } from 'react-native';
import { useWidgets } from '../../src/context';
import type { WidgetType } from '../../src/types/widget';
import { AVAILABLE_WIDGETS } from '../../src/types/widget';

interface WidgetSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

const WidgetSelectorModal: React.FC<WidgetSelectorModalProps> = ({ visible, onClose }) => {
  const { state, addWidget } = useWidgets();

  const getIconComponent = (iconName: string) => {
    const iconProps = { size: 20, color: '#6B7280' };

    switch (iconName) {
      case 'pie-chart':
        return <PieChart {...iconProps} />;
      case 'trending-up':
        return <TrendingUp {...iconProps} />;
      case 'target':
        return <Target {...iconProps} />;
      case 'bar-chart-3':
        return <BarChart3 {...iconProps} />;
      case 'clock':
        return <Clock {...iconProps} />;
      case 'calendar':
        return <Calendar {...iconProps} />;
      case 'zap':
        return <Zap {...iconProps} />;
      case 'piggy-bank':
        return <PiggyBank {...iconProps} />;
      default:
        return <PieChart {...iconProps} />;
    }
  };

  const availableWidgets = AVAILABLE_WIDGETS.filter((config) => {
    const hasValidComponent = config.component !== null && config.component !== undefined;
    const isNotAlreadyAdded = !state.widgets.some((w) => w.type === config.type);
    console.log(
      'Checking widget:',
      config.type,
      'hasValidComponent:',
      hasValidComponent,
      'isNotAlreadyAdded:',
      isNotAlreadyAdded
    );

    return hasValidComponent && isNotAlreadyAdded;
  });

  const handleAddWidget = async (type: WidgetType) => {
    try {
      await addWidget(type);
      onClose();
    } catch (error) {
      console.error('Failed to add widget:', error);
    }
  };

  const renderWidgetOption: ListRenderItem<(typeof availableWidgets)[0]> = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleAddWidget(item.type)}
      className="bg-white p-4 border border-gray-200 rounded-xl mb-3 shadow-sm"
    >
      <View className="flex-row items-start">
        <View className="mr-3 mt-1">{getIconComponent(item.icon)}</View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 mb-1">{item.title}</Text>
          <Text className="text-sm text-gray-600 leading-5">{item.description}</Text>
        </View>

        <View className="ml-3 bg-[#1F5F43] px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-medium">Add</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const keyExtractor = (item: (typeof availableWidgets)[0]) => item.type;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-[#F5EDE5] rounded-t-3xl max-h-[80%]">
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">Add Widget</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-white rounded-full shadow-sm">
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-6 py-4">
            <Text className="text-gray-600 mb-4">Choose a widget to add to your dashboard:</Text>

            {availableWidgets.length === 0 ? (
              <View className="items-center justify-center py-8">
                <Text className="text-gray-500 text-center text-base">
                  All available widgets have been added to your dashboard
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableWidgets}
                renderItem={renderWidgetOption}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default WidgetSelectorModal;
