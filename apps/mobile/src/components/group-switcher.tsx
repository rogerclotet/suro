import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { matchesGroupSearch } from "domain/group-search";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/avatar";
import { UnreadBadge } from "@/components/unread-badge";
import { useTranslations } from "@/i18n";
import { unreadCount } from "@/lib/notification-routing";
import { useUnreadNotifications } from "@/lib/notifications";
import { usePersistentQuery } from "@/lib/offline";
import { useTheme } from "@/theme";
import { Fab, Field, Loading, Txt, useFabScroll } from "@/ui";

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
  const fab = useFabScroll();
  const [search, setSearch] = useState("");
  const filteredGroups = groups?.filter((group) =>
    matchesGroupSearch(group, search),
  );

  function selectGroup(id: Id<"projects">) {
    router.push(`/${id}/home`);
  }

  function createGroup() {
    router.push("/create-group");
  }

  return (
    <View style={{ flex: 1 }}>
      <GroupSearchField value={search} onChangeText={setSearch} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom:
            Platform.OS === "android"
              ? insets.bottom + 96
              : Math.max(insets.bottom, 16),
        }}
        onScroll={fab.onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
            {groups.length > 0 && filteredGroups?.length === 0 ? (
              <Txt
                muted
                style={{ paddingVertical: 24, textAlign: "center" }}
                accessibilityLiveRegion="polite"
              >
                {tr("noSearchResults")}
              </Txt>
            ) : null}
            {[...(filteredGroups ?? [])]
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
      </ScrollView>
      <Fab
        onPress={createGroup}
        label={ti("createTitle")}
        extended={fab.extended}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

/** The groups search box, shared by the Groups list and the group switcher. */
export function GroupSearchField({
  value,
  onChangeText,
  style,
}: {
  value: string;
  onChangeText: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const tr = useTranslations("mobile.groups");
  return (
    <View
      style={[
        styles.search,
        { backgroundColor: t.inputBg, borderColor: t.border },
        style,
      ]}
    >
      <Search size={19} color={t.muted} />
      <Field
        value={value}
        onChangeText={onChangeText}
        placeholder={tr("searchPlaceholder")}
        accessibilityLabel={tr("searchPlaceholder")}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.searchInput}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel={tr("clearSearch")}
          hitSlop={4}
          style={({ pressed }) => [
            styles.clearSearch,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <X size={18} color={t.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  clearSearch: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
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
});
