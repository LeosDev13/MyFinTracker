import { Stack } from "expo-router";
import "../global.css";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="dashboard/index"
        options={{ title: "Dashboard", headerShown: false }}
      />
    </Stack>
  );
}
