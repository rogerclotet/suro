import { api } from "backend/convex/_generated/api";
import { useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { useTranslations } from "@/i18n";
import { unreadCount } from "@/lib/notification-routing";
import { useUnreadNotifications } from "@/lib/notifications";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

const NAME_MAX_WIDTH = 200;

function useGroup() {
  const pid = useProjectId();
  return usePersistentQuery(api.projects.get, { projectId: pid });
}

/**
 * A tab root's title: the group's avatar and name, opening its settings, as
 * WhatsApp and Teams do. Member changes, which those settings show, put a
 * badge on the avatar.
 */
export function GroupTitle() {
  const pid = useProjectId();
  const router = useRouter();
  const t = useTheme();
  const tr = useTranslations("mobile.groups");
  const group = useGroup();
  const memberChanges = unreadCount(useUnreadNotifications(), pid, "members");
  return (
    <Pressable
      onPress={() => router.push(`/group-settings?projectId=${pid}`)}
      accessibilityRole="button"
      accessibilityLabel={group?.name}
      accessibilityHint={tr("manageGroup")}
      hitSlop={6}
      style={({ pressed }) => [styles.title, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View>
        <Avatar
          kind="group"
          name={group?.name}
          image={group?.image}
          color={group?.color}
          size={28}
        />
        {memberChanges ? (
          <View
            accessible
            accessibilityLabel={tr("unreadCount", { count: memberChanges })}
            style={[
              styles.avatarBadge,
              { backgroundColor: t.primary, borderColor: t.bg },
            ]}
          />
        ) : null}
      </View>
      <Txt
        weight="700"
        size={17}
        numberOfLines={1}
        style={{ maxWidth: NAME_MAX_WIDTH }}
      >
        {group?.name ?? ""}
      </Txt>
    </Pressable>
  );
}

/**
 * The title of a section Home opens (Files, Notes, Secret Santa), with the
 * group it belongs to underneath, since no tab names it.
 */
export function SectionTitle({ title }: { title: string }) {
  const group = useGroup();
  return (
    <View
      style={{ alignItems: Platform.OS === "ios" ? "center" : "flex-start" }}
    >
      <Txt weight="700" size={17} numberOfLines={1}>
        {title}
      </Txt>
      {group ? (
        <Txt muted size={12} numberOfLines={1}>
          {group.name}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
});
