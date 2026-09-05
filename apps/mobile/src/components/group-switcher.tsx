import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/avatar";
import { UnreadBadge } from "@/components/unread-badge";
import { useTranslations } from "@/i18n";
import { unreadCount } from "@/lib/notification-routing";
import { useUnreadNotifications } from "@/lib/notifications";
import { usePersistentQuery } from "@/lib/offline";
import { useTheme } from "@/theme";
import { Loading, Txt } from "@/ui";

const ROW_AVATAR_SIZE = 52;

/**
 * Selecting a group opens its home tab.
 */
export function GroupsScreenContent() {
  const unread = useUnreadNotifications();
  const groups = usePersistentQuery(api.projects.listMineDetailed);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useTheme();
  const tr = useTranslations("mobile.groups");
  const ti = useTranslations("groups");

  function selectGroup(id: Id<"projects">) {
    router.push(`/${id}/home`);
  }

  function createGroup() {
    router.push("/create-group");
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        {groups === undefined ? (
          <View style={{ paddingVertical: 24 }}>
            <Loading />
          </View>
        ) : (
          <View>
            {groups.length === 0 ? (
              <Txt muted style={{ padding: 20 }}>
                {tr("empty")}
              </Txt>
            ) : null}
            {[...groups]
              .sort(
                (a, b) =>
                  (b.lastActivityAt ?? b._creationTime) -
                  (a.lastActivityAt ?? a._creationTime),
              )
              .map((group, index) => {
                const count = unreadCount(unread, group._id);
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
                        kind="group"
                        name={group.name}
                        image={group.image}
                        color={group.color}
                        size={ROW_AVATAR_SIZE}
                      />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Txt
                          weight={count ? "700" : "400"}
                          size={17}
                          numberOfLines={1}
                        >
                          {group.name}
                        </Txt>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <View style={{ flexDirection: "row" }}>
                            {group.members
                              .slice(0, 3)
                              .map((member, memberIndex) => (
                                <Avatar
                                  kind="user"
                                  key={member._id}
                                  name={member.name}
                                  image={member.image}
                                  color={member.avatarColor}
                                  size={20}
                                  style={{
                                    marginLeft: memberIndex ? -5 : 0,
                                    borderWidth: 1,
                                    borderColor: t.bg,
                                  }}
                                />
                              ))}
                          </View>
                          <Txt
                            muted
                            size={12}
                            numberOfLines={1}
                            style={{ flex: 1 }}
                          >
                            {group.members
                              .slice(0, 3)
                              .map(
                                (member) => member.name ?? tr("unnamedMember"),
                              )
                              .join(", ")}
                            {group.members.length > 3
                              ? ` · +${group.members.length - 3}`
                              : ""}
                          </Txt>
                        </View>
                      </View>
                      <UnreadBadge count={count} />
                    </Pressable>
                  </View>
                );
              })}
          </View>
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
          <View style={styles.createBadge}>
            <Plus color={t.primary} size={20} />
          </View>
          <Txt style={{ color: t.primary }}>{ti("createTitle")}</Txt>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 17,
  },
  createRow: { gap: 12, paddingVertical: 10 },
  createBadge: {
    width: ROW_AVATAR_SIZE,
    height: ROW_AVATAR_SIZE,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
