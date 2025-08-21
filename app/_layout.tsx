import { Stack } from 'expo-router';
import { Home, PlusCircle, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-get-random-values';
import '../global.css';
import { goToHomeScreen, goToNewMovementScreen, goToSettingsScreen } from '../src/_routes';
import { AppProvider, SettingsProvider, WidgetProvider } from '../src/context';
import { Database } from '../src/db/database';
import MenuBar from './_components/menuBar';

function LoadingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-[#F5EDE5]">
      <ActivityIndicator size="large" color="#1F5F43" />
      <Text className="mt-4 text-[#1C2B2E] text-lg">Initializing database...</Text>
    </View>
  );
}

export default function Layout() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    Database.init()
      .then(() => {
        setIsDbReady(true);
      })
      .catch((err) => {
        console.error('Failed to initialize database', err);
        setDbError(err.message || 'Failed to initialize database');
      });
  }, []);

  if (dbError) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F5EDE5] px-6">
        <Text className="text-red-600 text-lg font-semibold mb-2">Database Error</Text>
        <Text className="text-[#1C2B2E] text-center">{dbError}</Text>
      </View>
    );
  }

  if (!isDbReady) {
    return <LoadingScreen />;
  }

  const menuBarItems = [
    {
      onPress: goToHomeScreen,
      Icon: Home,
    },
    {
      onPress: goToNewMovementScreen,
      Icon: PlusCircle,
    },
    {
      onPress: goToSettingsScreen,
      Icon: Settings,
    },
  ];

  return (
    <SettingsProvider>
      <AppProvider>
        <WidgetProvider>
          <View className="flex-1">
            <Stack>
              <Stack.Screen name="index" options={{ title: 'Dashboard', headerShown: false }} />
              <Stack.Screen
                name="newTransaction"
                options={{ title: 'New Transaction', headerShown: false }}
              />
              <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: false }} />
              <Stack.Screen
                name="transactions"
                options={{ title: 'Transactions', headerShown: false }}
              />
              <Stack.Screen
                name="widgetManagement"
                options={{ title: 'Widget Management', headerShown: false }}
              />
            </Stack>

            <MenuBar items={menuBarItems} />
          </View>
        </WidgetProvider>
      </AppProvider>
    </SettingsProvider>
  );
}
