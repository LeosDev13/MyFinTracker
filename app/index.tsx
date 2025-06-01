import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-red-100">
      <Text className="text-3xl font-bold text-blue-600">Tailwind funciona ✅</Text>
    </View>
  );
}
