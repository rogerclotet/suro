import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Avatar, HEADER_AVATAR_SIZE, initials } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Button, Card, HEADER_BUTTON_INSET, Loading, Sheet, Txt } from "@/ui";

/**
 * Bottom-sheet group switcher, shared across every section. Selecting a group
 * keeps the user on the same `section` within it.
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
  const router = useRouter();
  const t = useTheme();
  const tr = useTranslations("mobile.groups");

  function selectGroup(id: Id<"projects">) {
    onClose();
    if (id === currentProjectId) {
      return;
    }
    // Replace (not push) so switching is lateral and the stack never grows.
    router.replace(`/${id}/${section}`);
  }

  function manageGroups() {
    onClose();
    router.push("/projects");
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tr("switchGroup")}
      </Txt>
      {groups === undefined ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ maxHeight: 320 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {groups.map((group) => {
            const active = group._id === currentProjectId;
            return (
              <Card key={group._id} onPress={() => selectGroup(group._id)}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Avatar
                    name={group.name}
                    image={group.image}
                    color={group.color}
                  />
                  <Txt
                    weight={active ? "700" : "400"}
                    style={{ flex: 1, color: active ? t.primary : t.text }}
                  >
                    {group.name}
                  </Txt>
                  {active && <Check color={t.primary} size={18} />}
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
      <Button
        title={tr("manageGroups")}
        variant="ghost"
        onPress={manageGroups}
      />
    </Sheet>
  );
}

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
          <Txt weight="700" size={17} style={{ color: t.primary }}>
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
