import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Convergence_400Regular } from "@expo-google-fonts/convergence";
import { useFonts } from "expo-font";
import type { ReactNode } from "react";
import { registerWidgetConfigurationScreen } from "react-native-android-widget";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "@/i18n";
import { convex, secureStorage } from "@/lib/convex";
import { OfflineProvider } from "@/lib/offline";
import { ThemeProvider } from "@/theme";
import { WidgetConfigurationScreen } from "./WidgetConfigurationScreen";

/** Providers the widget configuration activity needs (separate RN entry point). */
function WidgetConfigurationRoot({ children }: { children: ReactNode }) {
  const [fontsLoaded] = useFonts({ Convergence_400Regular });
  if (!fontsLoaded) {
    return null;
  }
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ConvexAuthProvider client={convex} storage={secureStorage}>
          <OfflineProvider>
            <I18nProvider>{children}</I18nProvider>
          </OfflineProvider>
        </ConvexAuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

registerWidgetConfigurationScreen((props) => (
  <WidgetConfigurationRoot>
    <WidgetConfigurationScreen {...props} />
  </WidgetConfigurationRoot>
));
