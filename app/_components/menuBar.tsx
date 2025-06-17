import React from 'react';
import { View } from 'react-native';
import TouchableIcon from './touchableIcon';

type MenuItem = {
  onPress: () => void;
  Icon: React.ComponentType<any>;
};

type MenuBarProps = {
  items: MenuItem[];
};

const MenuBar = ({ items }: MenuBarProps) => {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100">
      <View className="flex-row justify-around items-center px-6 py-2">
        {items.map((item, index) => (
          <TouchableIcon key={index} onPress={item.onPress} Icon={item.Icon} />
        ))}
      </View>

      <View className="items-center pb-2">
        <View className="w-32 h-1 bg-black rounded-full" />
      </View>
    </View>
  );
};

export default MenuBar;
