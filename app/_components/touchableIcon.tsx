import React from 'react';
import { type GestureResponderEvent, TouchableOpacity, View } from 'react-native';

type IconButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

const TouchableIcon = React.memo(({ onPress, Icon }: IconButtonProps) => {
  return (
    <TouchableOpacity
      className="text-center items-center justify-center min-h-[40px]"
      onPress={onPress}
    >
      <View className="w-6 h-6 mb-1 items-center justify-center">
        <Icon />
      </View>
    </TouchableOpacity>
  );
});

export default TouchableIcon;
