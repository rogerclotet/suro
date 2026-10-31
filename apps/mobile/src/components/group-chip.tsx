import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { matchesGroupSearch } from "domain/group-search";
import { type Href, useRouter } from "expo-router";
import { Check, ChevronDown, LayoutGrid } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { GroupSearchField } from "@/components/group-switcher";
import { UnreadBadge, UnreadDot } from "@/components/unread-badge";
import { useTranslations } from "@/i18n";
import type { GroupSection } from "@/lib/group-navigation";
import { unreadCount, unreadElsewhere } from "@/lib/notification-routing";
import { useUnreadNotifications } from "@/lib/notifications";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Loading, Sheet, Txt } from "@/ui";

// Short lists scan faster than they search.
const SEARCH_THRESHOLD = 6;
const NAME_MAX_WIDTH = 180;

/**
 * The header title on each tab root: which group this is, with a dot when
 * other groups have unread changes. It opens the group switcher, which keeps
 * the current section.
 */
export function GroupChip({ section }: { section: GroupSection }) {
  const pid = useProjectId();
  const t = useTheme();
  const tr = useTranslations("mobile.groups");
  const group = usePersistentQuery(api.projects.get, { projectId: pid });
  const unread = useUnreadNotifications();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={tr("switchGroupFrom", { name: group?.name ?? "" })}
        hitSlop={6}
        style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Avatar
          kind="group"
          name={group?.name}
          image={group?.image}
          color={group?.color}
          size={26}
        />
        <Txt
          weight="700"
          size={17}
          numberOfLines={1}
          style={{ maxWidth: NAME_MAX_WIDTH }}
        >
          {group?.name ?? ""}
        </Txt>
        <ChevronDown color={t.muted} size={16} />
        <UnreadDot count={unreadElsewhere(unread, pid)} />
      </Pressable>
      <GroupSwitcherSheet
        visible={open}
        onClose={() => setOpen(false)}
        section={section}
      />
    </>
  );
}

function GroupSwitcherSheet({
  visible,
  onClose,
  section,
}: {
  visible: boolean;
  onClose: () => void;
  section: GroupSection;
}) {
  const pid = useProjectId();
  const router = useRouter();
  const t = useTheme();
  const tr = useTranslations("mobile.groups");
  const groups = usePersistentQuery(api.projects.listMineDetailed);
  const unread = useUnreadNotifications();
  const [search, setSearch] = useState("");
  // Navigate once the sheet has gone: iOS drops a transition started under a
  // Modal that is still dismissing.
  const next = useRef<{ href: Href; replace: boolean } | null>(null);
  const shown = groups?.filter((group) => matchesGroupSearch(group, search));

  function choose(id: Id<"projects">) {
    if (id !== pid) {
      next.current = { href: `/${id}/${section}`, replace: true };
    }
    onClose();
  }

  function openGroupsList() {
    next.current = { href: "/groups", replace: false };
    onClose();
  }

  function handleClosed() {
    setSearch("");
    const target = next.current;
    next.current = null;
    if (!target) return;
    // Replacing the group keeps the Groups list one step back.
    if (target.replace) router.replace(target.href);
    else router.dismissTo(target.href);
  }

  return (
    <Sheet visible={visible} onClose={onClose} onClosed={handleClosed}>
      <Txt size={18} display weight="700">
        {tr("switchGroup")}
      </Txt>
      {groups && groups.length >= SEARCH_THRESHOLD ? (
        <GroupSearchField
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
      ) : null}
      <ScrollView
        style={{ flexGrow: 0 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {shown === undefined ? (
          <Loading />
        ) : shown.length === 0 ? (
          <Txt muted style={{ paddingVertical: 16, textAlign: "center" }}>
            {tr("noSearchResults")}
          </Txt>
        ) : (
          shown.map((group) => {
            const current = group._id === pid;
            const count = unreadCount(unread, group._id);
            return (
              <Pressable
                key={group._id}
                onPress={() => choose(group._id)}
                accessibilityRole="button"
                accessibilityState={{ selected: current }}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Avatar
                  kind="group"
                  name={group.name}
                  image={group.image}
                  color={group.color}
                  size={36}
                />
                <Txt
                  weight={current || count ? "700" : "400"}
                  numberOfLines={1}
                  style={{ flex: 1, color: current ? t.primary : t.text }}
                >
                  {group.name}
                </Txt>
                <UnreadBadge count={count} />
                {current ? <Check color={t.primary} size={20} /> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
      <Pressable
        onPress={openGroupsList}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.row,
          styles.allGroups,
          { borderColor: t.border, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <View style={styles.allGroupsIcon}>
          <LayoutGrid color={t.primary} size={22} />
        </View>
        <Txt weight="700" style={{ flex: 1 }}>
          {tr("allGroups")}
        </Txt>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  search: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingVertical: 8,
  },
  allGroups: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  allGroupsIcon: {
    width: 36,
    alignItems: "center",
  },
});
