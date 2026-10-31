import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";
import { GroupChip } from "@/components/group-chip";
import { headerBackAction } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";

/** The tabs of a group, each the root of its own stack. */
export type GroupSection = "home" | "lists" | "calendar" | "expenses";

/**
 * Header options for a tab root: Back leaves the group, and the title is the
 * group chip, which switches group without leaving the section. Nested
 * screens keep their own title and native Back.
 */
export function useGroupRootOptions(section: GroupSection) {
  const projectId = useProjectId();
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations("nav");
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
    ...headerBackAction(backToGroups, tNav("groups")),
    headerTitle: () => <GroupChip section={section} />,
  };
}
