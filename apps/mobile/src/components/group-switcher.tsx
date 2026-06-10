import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Check, ChevronRight, Plus, Settings2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, HEADER_AVATAR_SIZE, initials } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { catppuccinSwatch } from "@/lib/catppuccin-colors";
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
  const groups = useQuery(api.projects.listMine);
  const me = useQuery(api.users.me);
  const router = useRouter();
  const t = useTheme();
  const tr = useTranslations("mobile.groups");
  const tp = useTranslations("mobile.profile");
  const ti = useTranslations("groups");

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

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tr("switchGroup")}
      </Txt>
      {groups === undefined ? (
        <Loading />
      ) : (
        <ScrollView style={{ maxHeight: 320 }}>
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
      {/* The only standalone action: create a new group. */}
      <Pressable
        onPress={createGroup}
        style={({ pressed }) => [
          styles.rowMain,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <View
          style={[
            styles.createBadge,
            { width: ROW_AVATAR_SIZE, height: ROW_AVATAR_SIZE },
            { backgroundColor: t.primary },
          ]}
        >
          <Plus color={t.onPrimary} size={20} />
        </View>
        <Txt weight="700" style={{ color: t.primary }}>
          {ti("createTitle")}
        </Txt>
      </Pressable>
      {/* Account entry: replaces the old header profile badge — same Liquid
          Glass-adjacent home for "you", tapping it opens the preferences page. */}
      <Card onPress={openProfile}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  manageButton: { padding: 8 },
  createBadge: {
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
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
  const project = useQuery(api.projects.get, { projectId });
  const [switching, setSwitching] = useState(false);
  const t = useTheme();
  const tr = useTranslations("mobile.groups");

  return (
    <>
      {variant === "glass" ? (
        <Pressable
          onPress={() => setSwitching(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={tr("switchGroup")}
        >
          <Txt
            weight="700"
            size={17}
            style={{ color: catppuccinSwatch(project?.color)?.bg ?? t.primary }}
          >
            {project?.name ? initials(project.name) : ""}
          </Txt>
        </Pressable>
      ) : (
        <Avatar
          name={project?.name}
          image={project?.image}
          color={project?.color}
          size={HEADER_AVATAR_SIZE}
          onPress={() => setSwitching(true)}
          accessibilityLabel={tr("switchGroup")}
          style={{ marginHorizontal: HEADER_BUTTON_INSET }}
        />
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
