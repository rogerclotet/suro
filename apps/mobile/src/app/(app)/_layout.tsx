import { useConvexAuth } from "convex/react";
import { Redirect, Stack } from "expo-router";
import { FONT, useTheme } from "@/theme";

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const t = useTheme();

  if (isLoading) {
    return null;
  }
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { fontFamily: FONT, color: t.text },
        headerTintColor: t.primary,
        contentStyle: { backgroundColor: t.bg },
      }}
    />
  );
}
