import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { sectionHeaderBadges } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Button, Card, Fab, Field, Loading, Screen, Sheet, Txt } from "@/ui";

export default function ExpensesOverview() {
  const pid = useProjectId();
  const pots = useQuery(api.expenses.listPots, { projectId: pid });
  const members = useQuery(api.projects.members, { projectId: pid });
  const router = useRouter();
  const t = useTheme();
  const [creating, setCreating] = useState(false);
  const tExp = useTranslations("mobile.expenses");
  const tc = useTranslations("mobile.common");

  // Expenses are a group feature: a pot needs at least two members to split
  // between. For a solo group, show an explainer instead — mirrors the PWA.
  const soloGroup = members !== undefined && members.length === 1;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tExp("title"),
          ...sectionHeaderBadges(
            "expenses",
            soloGroup
              ? undefined
              : { onPress: () => setCreating(true), label: tExp("newPot") },
          ),
        }}
      />
      {pots === undefined || members === undefined ? (
        <Loading />
      ) : soloGroup ? (
        <Txt muted style={{ padding: 24, textAlign: "center" }}>
          {tExp("infoDescription")}
        </Txt>
      ) : pots.length === 0 ? (
        <Txt muted style={{ padding: 24, textAlign: "center" }}>
          {tExp("empty")}
        </Txt>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 96 }}
        >
          {pots.map((pot) => (
            <Card
              key={pot._id}
              onPress={() => router.push(`/${pid}/expenses/${pot._id}`)}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Txt
                  size={17}
                  weight="700"
                  style={{ flex: 1 }}
                  numberOfLines={1}
                >
                  {pot.name}
                </Txt>
                {pot.settledAt ? (
                  <Txt
                    size={12}
                    weight="700"
                    style={{
                      color: t.muted,
                      borderWidth: 1,
                      borderColor: t.border,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    {tExp("settled")}
                  </Txt>
                ) : null}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {pot.members.slice(0, 6).map((member, index) => (
                  <Avatar
                    key={member._id ?? index}
                    name={member.name}
                    image={member.image}
                    color={member.avatarColor}
                    size={24}
                  />
                ))}
                <Txt muted size={13} style={{ marginLeft: 4 }}>
                  {tc("memberCount", { count: pot.members.length })}
                </Txt>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
      {soloGroup ? null : (
        <>
          <Fab onPress={() => setCreating(true)} label={tExp("newPot")} />
          <CreatePotSheet
            visible={creating}
            projectId={pid}
            onClose={() => setCreating(false)}
          />
        </>
      )}
    </Screen>
  );
}

function CreatePotSheet({
  visible,
  projectId,
  onClose,
}: {
  visible: boolean;
  projectId: Id<"projects">;
  onClose: () => void;
}) {
  const members = useQuery(api.projects.members, { projectId });
  const me = useQuery(api.users.me);
  const createPot = useMutation(api.expenses.createPot);
  const router = useRouter();
  const t = useTheme();
  const tExp = useTranslations("mobile.expenses");
  const tc = useTranslations("mobile.common");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<Id<"users">> | null>(null);
  const [busy, setBusy] = useState(false);

  // Default to just the current user selected, until they pick others.
  const chosen = selected ?? new Set(me ? [me._id] : []);

  function toggle(userId: Id<"users">) {
    const next = new Set(chosen);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelected(next);
  }

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || chosen.size < 2) {
      return;
    }
    setBusy(true);
    try {
      const potId = await createPot({
        projectId,
        name: trimmed,
        memberIds: [...chosen],
      });
      setName("");
      setSelected(null);
      onClose();
      router.push(`/${projectId}/expenses/${potId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tExp("newPot")}
      </Txt>
      <Field
        placeholder={tExp("namePlaceholder")}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <Txt muted size={13}>
        {tExp("members", { count: chosen.size })}
      </Txt>
      {members === undefined ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ maxHeight: 260 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {members.map((member) => {
            const on = chosen.has(member._id);
            return (
              <Pressable
                key={member._id}
                onPress={() => toggle(member._id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderWidth: 1,
                  borderColor: on ? t.primary : t.border,
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <Avatar
                  name={member.name}
                  image={member.image}
                  color={member.avatarColor}
                  size={28}
                />
                <Txt style={{ flex: 1 }} numberOfLines={1}>
                  {member.name ?? tc("member")}
                </Txt>
                {on ? (
                  <Txt weight="700" style={{ color: t.primary }}>
                    ✓
                  </Txt>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <Button
        title={busy ? tc("creating") : tExp("createPot")}
        disabled={busy || name.trim().length === 0 || chosen.size < 2}
        onPress={submit}
      />
    </Sheet>
  );
}
