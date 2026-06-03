import { ConvexAuthProvider } from "@convex-dev/auth/react";
import {
  Convergence_400Regular,
  useFonts,
} from "@expo-google-fonts/convergence";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { convex, secureStorage } from "@/lib/convex";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Convergence_400Regular });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexAuthProvider client={convex} storage={secureStorage}>
          <Stack screenOptions={{ headerShown: false }} />
        </ConvexAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
