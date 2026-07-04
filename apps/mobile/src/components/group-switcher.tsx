import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useRouter } from "expo-router";
import {
  Check,
  ChevronDown,
  ChevronRight,
  MessageSquarePlus,
  Plus,
  Settings,
  Settings2,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, HEADER_AVATAR_SIZE, initials } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { catppuccinSwatch } from "@/lib/catppuccin-colors";
import { useFeedback } from "@/lib/feedback-state";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Card, HEADER_BUTTON_INSET, Loading, Sheet, Txt } from "@/ui";

const ROW_AVATAR_SIZE = 38;

/**
 * Bottom-sheet group switcher, shared across every section. Selecting a group
 * keeps the user on the same `section` within it; each row also exposes a manage
 * button (invite, edit, leave all live on the per-group manage page now). The
 * only standalone action is "Create group", sitting between the list and the
 * account entry.
 */
export function GroupSwitcherSheet({
  visible,
  currentProjectId,
  section,
  onClose,
}: {
  visible: boolean;
  currentProjectId: Id<"projects">;
  section: string;
  onClose: () => void;
}) {
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
  const [pendingFeedback, setPendingFeedback] = useState(false);

  function selectGroup(id: Id<"projects">) {
    onClose();
    if (id === currentProjectId) {
      return;
    }
    // Replace (not push) so switching is lateral and the stack never grows.
    router.replace(`/${id}/${section}`);
  }

  function manageGroup(id: Id<"projects">) {
    onClose();
    router.push(`/group-settings?projectId=${id}`);
  }

  function createGroup() {
    onClose();
    router.push("/create-group");
  }

  function openProfile() {
    onClose();
    router.push("/profile");
  }

  function openPreferences() {
    onClose();
    router.push("/preferences");
  }

  function requestFeedback() {
    setPendingFeedback(true);
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      onClosed={() => {
        if (pendingFeedback) {
          setPendingFeedback(false);
          openFeedback();
        }
      }}
    >
      <Txt size={18} weight="700">
        {tr("switchGroup")}
      </Txt>
      {/* One inset-grouped card for the whole list: every row — including
          "Create group" — shares the same anatomy (38px leading visual + label)
          so the create action reads as the list's final row, not a stray
          button. It sits below the ScrollView so it stays reachable however
          many groups there are. */}
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
          {/* Dashed outline instead of a filled badge: same footprint as the
              group avatars, but clearly "add a new one of these". */}
          <View style={[styles.createBadge, { borderColor: t.primary }]}>
            <Plus color={t.primary} size={20} />
          </View>
          <Txt style={{ color: t.primary }}>{ti("createTitle")}</Txt>
        </Pressable>
      </View>
      <Card onPress={requestFeedback}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <MessageSquarePlus color={t.primary} size={22} />
          <Txt weight="700" style={{ flex: 1 }}>
            {tNav("feedback")}
          </Txt>
          <ChevronRight color={t.muted} size={18} />
        </View>
      </Card>
      {/* Account entries: the profile card (who you are) and its square
          preferences sibling (how the app behaves), styled as one family. */}
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
    </Sheet>
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
  // Mirrors `Card` (border, radius, bg) so the gear square and the profile
  // card read as siblings; stretches to the card's height and stays square.
  prefsButton: {
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
});

/**
 * Header-left group badge that opens the switcher drawer. The `filled` variant
 * (Android) is a rounded-square Catppuccin avatar; the `glass` variant (iOS) is
 * just the group's initials, tinted, sitting in the native Liquid Glass capsule.
 */
export function GroupBadge({
  section,
  variant = "filled",
}: {
  section: string;
  variant?: "filled" | "glass";
}) {
  const projectId = useProjectId();
  const project = usePersistentQuery(api.projects.get, { projectId });
  const [switching, setSwitching] = useState(false);
  const t = useTheme();
  const tr = useTranslations("mobile.groups");

  // A chevron-down beside the badge signals "this opens a switcher" — the
  // bare avatar/initials read as a static label, not a button.
  const glassTint = catppuccinSwatch(project?.color)?.bg ?? t.primary;

  return (
    <>
      {variant === "glass" ? (
        <Pressable
          onPress={() => setSwitching(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr("switchGroup")}
          style={styles.badgeRow}
        >
          <Txt weight="700" size={17} style={{ color: glassTint }}>
            {project?.name ? initials(project.name) : ""}
          </Txt>
          {/* Same tint as the initials so the capsule reads as one control. */}
          <ChevronDown color={glassTint} size={14} strokeWidth={2.5} />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => setSwitching(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr("switchGroup")}
          style={({ pressed }) => [
            styles.badgeRow,
            {
              marginHorizontal: HEADER_BUTTON_INSET,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Avatar
            name={project?.name}
            image={project?.image}
            color={project?.color}
            size={HEADER_AVATAR_SIZE}
          />
          <ChevronDown color={t.muted} size={14} />
        </Pressable>
      )}
      <GroupSwitcherSheet
        visible={switching}
        currentProjectId={projectId}
        section={section}
        onClose={() => setSwitching(false)}
      />
    </>
  );
}
