import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack } from "expo-router";
import { View } from "react-native";
import { Button, Loading, Screen, Txt } from "@/ui";

export default function Profile() {
  const user = useQuery(api.users.me);
  const { signOut } = useAuthActions();

  return (
    <Screen>
      <Stack.Screen options={{ title: "Profile" }} />
      {user === undefined ? (
        <Loading />
      ) : (
        <View style={{ padding: 16, gap: 24 }}>
          <View style={{ gap: 4 }}>
            {user?.name ? (
              <Txt size={20} weight="700">
                {user.name}
              </Txt>
            ) : null}
            {user?.email ? <Txt muted>{user.email}</Txt> : null}
          </View>
          <Button
            title="Sign out"
            variant="ghost"
            onPress={() => void signOut()}
          />
        </View>
      )}
    </Screen>
  );
}
