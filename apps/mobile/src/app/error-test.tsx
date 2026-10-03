import * as Sentry from "@sentry/react-native";
import type { ErrorBoundaryProps } from "expo-router";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, ScrollView, View } from "react-native";
import { useTranslations } from "@/i18n";
import { captureException, flushErrors } from "@/lib/error-reporting";
import { Button, Screen, Txt } from "@/ui";

// Temporary, unlinked route. Open suro:///error-test on the device.
export default function ErrorTestScreen() {
  const t = useTranslations("errorTest");
  const tc = useTranslations("common");
  const router = useRouter();
  const [renderError, setRenderError] = useState(false);
  const enabled =
    !__DEV__ &&
    process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT === "production" &&
    !!process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (renderError) throw new Error("Suro mobile render error test");

  function confirmNativeCrash() {
    Alert.alert(t("nativeCrash"), t("nativeWarning"), [
      { text: tc("cancel"), style: "cancel" },
      {
        text: t("crashNow"),
        style: "destructive",
        onPress: () => Sentry.nativeCrash(),
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Txt size={24} display weight="700">
          {t("title")}
        </Txt>
        <Txt muted>{enabled ? t("instructions") : t("disabled")}</Txt>
        <Button
          title={t("capture")}
          disabled={!enabled}
          onPress={async () => {
            captureException(new Error("Suro mobile captured error test"), {
              action: "mobile_error_test",
            });
            await flushErrors();
          }}
        />
        <Button
          title={t("clientError")}
          disabled={!enabled}
          onPress={() => {
            throw new Error("Suro mobile uncaught JavaScript error test");
          }}
        />
        <Button
          title={t("promiseError")}
          disabled={!enabled}
          onPress={() => {
            void Promise.reject(
              new Error("Suro mobile unhandled rejection test"),
            );
          }}
        />
        <Button
          title={t("renderError")}
          disabled={!enabled}
          onPress={() => setRenderError(true)}
        />
        <Button
          title={t("nativeCrash")}
          variant="danger"
          disabled={!enabled || Platform.OS === "web"}
          onPress={confirmNativeCrash}
        />
        <Button
          title={tc("close")}
          variant="ghost"
          onPress={() => router.replace("/")}
        />
      </ScrollView>
    </Screen>
  );
}

// Metro's autoWrapExpoRouterErrorBoundary reports this caught render error.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const t = useTranslations("common");
  return (
    <Screen>
      <View style={{ padding: 24, gap: 16 }}>
        <Txt>{t("error")}</Txt>
        <Button title={t("tryAgain")} onPress={() => void retry()} />
      </View>
    </Screen>
  );
}
