import { ConvexAuthProvider } from "@convex-dev/auth/react";
import {
  Convergence_400Regular,
  useFonts,
} from "@expo-google-fonts/convergence";
import { Stack } from "expo-router";
import type { ComponentType, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { GestureHandlerRootView as RNGestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { convex, secureStorage } from "@/lib/convex";

// GestureHandlerRootViewProps drops `children` under React 19 types; re-type it
// to the props we actually use (runtime behavior is unchanged).
const GestureHandlerRootView =
  RNGestureHandlerRootView as unknown as ComponentType<{
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }>;

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
