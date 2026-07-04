// Side-effect import: install Intl polyfills before any component renders.
import "@/polyfills";
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
import { Onboarding } from "@/components/onboarding";
import { I18nProvider } from "@/i18n";
import { AnalyticsBridge, AnalyticsProvider } from "@/lib/analytics";
import { convex, secureStorage } from "@/lib/convex";
import { OfflineProvider } from "@/lib/offline";
import { ThemeProvider } from "@/theme";

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
        <ThemeProvider>
          <AnalyticsProvider>
            <ConvexAuthProvider client={convex} storage={secureStorage}>
              <OfflineProvider>
                <I18nProvider>
                  <AnalyticsBridge />
                  <Stack screenOptions={{ headerShown: false }} />
                  {/* Floats over the launch redirect's landing screen; renders
                      nothing once the user has completed (or skipped) it. */}
                  <Onboarding />
                </I18nProvider>
              </OfflineProvider>
            </ConvexAuthProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
