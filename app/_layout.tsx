import { Stack, router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { House, SquarePlus } from "lucide-react-native";
import "../global.css";
import TouchableIcon from "./_components/touchableIcon";
import MenuBar from "./_components/menuBar";
import { goToHomeScreen, goToNewMovementScreen } from "./_routes";

export default function Layout() {
  const menuBarItems = [{
    onPress: goToHomeScreen,
    Icon: House
  },
  {
    onPress: goToNewMovementScreen,
    Icon: SquarePlus
  }];

  return (
    <View className="flex-1">
      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: "Dashboard", headerShown: false }}
        />
        <Stack.Screen
          name="newTransaction"
          options={{ title: "New Transaction", headerShown: false }}
        />
      </Stack>

      <MenuBar items={
        menuBarItems
      } />
    </View>
  );
}
