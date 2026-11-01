import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";
import { GroupsBackButton, GroupTitle } from "@/components/group-header";
import { useProjectId } from "@/lib/project-id";

/** The tabs of a group, each the root of its own stack. */
type GroupSection = "home" | "lists" | "calendar" | "expenses";

/**
 * Header options for a tab root: Back leaves the group for the Groups list,
 * and the title names the group and opens its settings. Nested screens keep
 * their own title and native Back.
 */
export function useGroupRootOptions(section: GroupSection) {
  const projectId = useProjectId();
  const router = useRouter();
  const pathname = usePathname();
  const backToGroups = useCallback(() => router.dismissTo("/groups"), [router]);
  useFocusEffect(
    useCallback(() => {
      if (pathname !== `/${projectId}/${section}`) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          backToGroups();
          return true;
        },
      );
      return () => subscription.remove();
    }, [pathname, projectId, section, backToGroups]),
  );
  return {
    headerLeft: () => <GroupsBackButton onPress={backToGroups} />,
    headerTitle: () => <GroupTitle />,
  };
}
