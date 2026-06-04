import { GroupBadge } from "@/components/group-switcher";
import { ProfileBadge } from "@/components/profile-badge";

/**
 * Header options for a section: the group badge (left) and the profile badge
 * (right).
 *
 * The `unstable_header*Items` API is used on iOS only (react-navigation gates
 * it to iOS); there we render the `glass` variant inside the native Liquid Glass
 * capsule — group initials and a person icon, no colored background.
 * `headerLeft`/`headerRight` are the Android path, where the filled Catppuccin
 * avatar is shown (Android has no capsule).
 */
export function sectionHeaderBadges(section: string) {
  return {
    headerLeft: () => <GroupBadge section={section} />,
    headerRight: () => <ProfileBadge />,
    unstable_headerLeftItems: () => [
      {
        type: "custom" as const,
        element: <GroupBadge section={section} variant="glass" />,
      },
    ],
    unstable_headerRightItems: () => [
      {
        type: "custom" as const,
        element: <ProfileBadge variant="glass" />,
      },
    ],
  };
}
