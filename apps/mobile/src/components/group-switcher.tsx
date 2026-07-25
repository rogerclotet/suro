import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useRouter } from "expo-router";
import {
  Check,
  ChevronRight,
  MessageSquarePlus,
  Plus,
  Settings,
  Settings2,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useFeedback } from "@/lib/feedback-state";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Card, Loading, Txt } from "@/ui";

const ROW_AVATAR_SIZE = 38;

/**
 * Full-screen group switcher: group list, create, feedback, and account entries.
 * Selecting a group opens its home tab.
 */
export function GroupsScreenContent() {
  const currentProjectId = useProjectId();
  const groups = usePersistentQuery(api.projects.listMine);
  const me = usePersistentQuery(api.users.me);
  const router = useRouter();
  const t = useTheme();
  const tr = useTranslations("mobile.groups");
  const tNav = useTranslations("nav");
  const tp = useTranslations("mobile.profile");
  const tpref = useTranslations("mobile.preferences");
  const ti = useTranslations("groups");
  const { openFeedback } = useFeedback();

  function selectGroup(id: Id<"projects">) {
    if (id === currentProjectId) {
      return;
    }
    router.replace(`/${id}/home`);
  }

  function manageGroup(id: Id<"projects">) {
    router.push(`/group-settings?projectId=${id}`);
  }

  function createGroup() {
    router.push("/create-group");
  }

  function openProfile() {
    router.push("/profile");
  }

  function openPreferences() {
    router.push("/preferences");
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View
        style={[
          styles.listCard,
          { backgroundColor: t.card, borderColor: t.border },
        ]}
      >
        {groups === undefined ? (
          <View style={{ paddingVertical: 24 }}>
            <Loading />
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 300 }}>
            {groups.map((group, index) => {
              const active = group._id === currentProjectId;
              return (
                <View
                  key={group._id}
                  style={[
                    styles.row,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth },
                    { borderColor: t.border },
                  ]}
                >
                  <Pressable
                    onPress={() => selectGroup(group._id)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.rowMain,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Avatar
                      name={group.name}
                      image={group.image}
                      color={group.color}
                      size={ROW_AVATAR_SIZE}
                    />
                    <Txt
                      weight={active ? "700" : "400"}
                      numberOfLines={1}
                      style={{ flex: 1, color: active ? t.primary : t.text }}
                    >
                      {group.name}
                    </Txt>
                    {active ? <Check color={t.primary} size={18} /> : null}
                  </Pressable>
                  <Pressable
                    onPress={() => manageGroup(group._id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={tr("manageGroup")}
                    style={({ pressed }) => [
                      styles.manageButton,
                      { opacity: pressed ? 0.5 : 1 },
                    ]}
                  >
                    <Settings2 color={t.muted} size={20} />
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
        <Pressable
          onPress={createGroup}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.row,
            styles.createRow,
            {
              borderTopWidth: StyleSheet.hairlineWidth,
              borderColor: t.border,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <View style={[styles.createBadge, { borderColor: t.primary }]}>
            <Plus color={t.primary} size={20} />
          </View>
          <Txt style={{ color: t.primary }}>{ti("createTitle")}</Txt>
        </Pressable>
      </View>
      <Card onPress={openFeedback}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <MessageSquarePlus color={t.primary} size={22} />
          <Txt weight="700" style={{ flex: 1 }}>
            {tNav("feedback")}
          </Txt>
          <ChevronRight color={t.muted} size={18} />
        </View>
      </Card>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "stretch" }}>
        <View style={{ flex: 1 }}>
          <Card onPress={openProfile}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Avatar
                name={me?.name}
                image={me?.customImage ?? me?.image}
                color={me?.avatarColor}
              />
              <View style={{ flex: 1 }}>
                <Txt weight="700" numberOfLines={1}>
                  {me?.name ?? tp("title")}
                </Txt>
                {me?.email ? (
                  <Txt muted size={13} numberOfLines={1}>
                    {me.email}
                  </Txt>
                ) : null}
              </View>
              <ChevronRight color={t.muted} size={18} />
            </View>
          </Card>
        </View>
        <Pressable
          onPress={openPreferences}
          accessibilityRole="button"
          accessibilityLabel={tpref("title")}
          style={({ pressed }) => [
            styles.prefsButton,
            {
              backgroundColor: t.card,
              borderColor: t.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Settings color={t.muted} size={22} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  manageButton: { padding: 8 },
  createRow: { gap: 12, paddingVertical: 10 },
  createBadge: {
    width: ROW_AVATAR_SIZE,
    height: ROW_AVATAR_SIZE,
    borderRadius: 11,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  prefsButton: {
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
