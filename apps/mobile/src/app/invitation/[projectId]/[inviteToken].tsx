import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { Button, Center, Loading, Screen, Txt } from "@/ui";

/**
 * Deep-link target for an invite (suro://invitation/<projectId>/<inviteToken>),
 * also reachable from the in-app "Join a group" paste flow. Lives outside the
 * (app) group so it can prompt for login itself instead of being swallowed by
 * the auth redirect.
 */
export default function InvitationScreen() {
  const { projectId, inviteToken } = useLocalSearchParams<{
    projectId: string;
    inviteToken: string;
  }>();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const t = useTranslations("invitation");
  const router = useRouter();

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }
  if (!isAuthenticated) {
    return (
      <Screen>
        <Center>
          <View style={{ gap: 16, padding: 24, alignItems: "center" }}>
            <Txt size={18} weight="700" style={{ textAlign: "center" }}>
              {t("loginPrompt")}
            </Txt>
            <Button
              title={t("accept")}
              onPress={() => router.replace("/login")}
            />
          </View>
        </Center>
      </Screen>
    );
  }
  return (
    <Invite projectId={projectId as Id<"projects">} inviteToken={inviteToken} />
  );
}

function Invite({
  projectId,
  inviteToken,
}: {
  projectId: Id<"projects">;
  inviteToken: string;
}) {
  const preview = useQuery(api.projects.getByInvite, {
    projectId,
    inviteToken,
  });
  const acceptInvite = useMutation(api.projects.acceptInvite);
  const t = useTranslations("invitation");
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  if (preview === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }
  if (preview === null) {
    return (
      <Screen>
        <Center>
          <Txt size={18} weight="700">
            {t("invalidTitle")}
          </Txt>
        </Center>
      </Screen>
    );
  }

  async function join() {
    setJoining(true);
    try {
      await acceptInvite({ projectId, inviteToken });
      router.replace(`/${projectId}/home`);
    } catch {
      setJoining(false);
      Alert.alert(t("acceptError"));
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, gap: 24 }}>
        <View style={{ alignItems: "center", gap: 12, paddingTop: 24 }}>
          <Avatar
            name={preview.name}
            image={preview.image}
            color={preview.color}
            size={72}
          />
          <Txt size={24} weight="700">
            {preview.name}
          </Txt>
        </View>
        <View style={{ gap: 10 }}>
          <Txt muted>{t("participants")}</Txt>
          {preview.members.map((member) => (
            <View
              key={member._id}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Avatar
                name={member.name}
                image={member.image}
                color={member.avatarColor}
                size={28}
              />
              <Txt>{member.name ?? ""}</Txt>
            </View>
          ))}
        </View>
        <View style={{ marginTop: "auto" }}>
          <Button title={t("accept")} onPress={join} disabled={joining} />
        </View>
      </View>
    </Screen>
  );
}
