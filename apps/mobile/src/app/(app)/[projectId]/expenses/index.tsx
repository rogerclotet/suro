import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { sectionHeaderBadges } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import {
  useOfflineListPotsOverview,
  usePersistentQuery,
  useQueuedMutation,
} from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useStable } from "@/lib/use-stable";
import { useTheme } from "@/theme";
import {
  Button,
  Card,
  Fab,
  Field,
  Loading,
  Screen,
  Sheet,
  Txt,
  useFabScroll,
} from "@/ui";
import SoloExpensesView from "./solo-expenses";

const SETTLED_PAGE_SIZE = 5;

type OverviewPot = FunctionReturnType<
  typeof api.expenses.listPotsOverview
>["active"][number];

export default function ExpensesOverview() {
  const pid = useProjectId();
  const [settledLimit, setSettledLimit] = useState(SETTLED_PAGE_SIZE);
  const overview = useStable(useOfflineListPotsOverview(pid, settledLimit));
  const members = usePersistentQuery(api.projects.members, { projectId: pid });
  const router = useRouter();
  const t = useTheme();
  const [creating, setCreating] = useState(false);
  const fab = useFabScroll();
  const tExp = useTranslations("mobile.expenses");

  // Solo groups get a personal expense tracker instead of shared pots.
  const soloGroup = members !== undefined && members.length === 1;
  const isEmpty =
    overview !== undefined &&
    overview.active.length === 0 &&
    overview.settled.length === 0;
  const openPot = (potId: Id<"pots">) =>
    router.push(`/${pid}/expenses/${potId}`);

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
      {members === undefined ? (
        <Loading />
      ) : soloGroup ? (
        <SoloExpensesView projectId={pid} />
      ) : overview === undefined ? (
        <Loading />
      ) : isEmpty ? (
        <Txt muted style={{ padding: 24, textAlign: "center" }}>
          {tExp("empty")}
        </Txt>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 96 }}
          onScroll={fab.onScroll}
          scrollEventThrottle={16}
        >
          {overview.active.map((pot) => (
            <PotCard key={pot._id} pot={pot} onPress={() => openPot(pot._id)} />
          ))}
          {overview.settled.length > 0 ? (
            <>
              {/* Settled pots recede into their own muted section. */}
              <Txt
                muted
                size={12}
                style={{
                  marginTop: overview.active.length > 0 ? 12 : 0,
                  letterSpacing: 1,
                }}
              >
                {tExp("settled").toUpperCase()}
              </Txt>
              {overview.settled.map((pot) => (
                <View key={pot._id} style={{ opacity: 0.7 }}>
                  <PotCard pot={pot} muted onPress={() => openPot(pot._id)} />
                </View>
              ))}
              {overview.hasMoreSettled ? (
                <Pressable
                  onPress={() =>
                    setSettledLimit((limit) => limit + SETTLED_PAGE_SIZE)
                  }
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 12,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <ChevronDown color={t.muted} size={16} />
                  <Txt muted size={13} weight="700">
                    {tExp("showMoreSettled")}
                  </Txt>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      )}
      {soloGroup ? null : (
        <>
          <Fab
            onPress={() => setCreating(true)}
            label={tExp("newPot")}
            extended={fab.extended}
          />
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

function PotCard({
  pot,
  onPress,
  muted = false,
}: {
  pot: OverviewPot;
  onPress: () => void;
  muted?: boolean;
}) {
  const tc = useTranslations("mobile.common");
  return (
    <Card onPress={onPress} muted={muted}>
      <Txt size={17} weight="700" numberOfLines={1}>
        {pot.name}
      </Txt>
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
  const members = usePersistentQuery(api.projects.members, { projectId });
  const me = usePersistentQuery(api.users.me);
  const createPot = useQueuedMutation(api.expenses.createPot);
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
