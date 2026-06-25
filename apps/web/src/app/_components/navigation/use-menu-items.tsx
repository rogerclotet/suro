"use client";

import {
  Calendar,
  EllipsisIcon,
  FileTextIcon,
  FolderOpen,
  GiftIcon,
  HandCoins,
  Home,
  LayoutTemplateIcon,
  LightbulbIcon,
  ListTodo,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { usePathname } from "@/i18n/navigation";

export type MenuItemHref =
  | "#"
  | { pathname: string; params: Record<string, string> };

export type MenuItem = {
  name: string;
  href: MenuItemHref;
  /**
   * Canonical internal pathname template (e.g. "/groups/[projectId]/lists").
   * Use for active-state matching against `usePathname()` (also returns canonical).
   */
  path: string;
  section: string;
  icon: ReactNode;
  disabled?: boolean;
  children?: MenuItem[];
  isActive?: (project: Project) => boolean;
};

type MenuItemPart = {
  nameKey: string;
  pathPart: string;
  icon: ReactNode;
  disabled?: boolean;
  children?: MenuItemPart[];
  isActive?: (project: Project) => boolean;
};

const DEFAULT_SECTION = "home";

const itemParts: MenuItemPart[] = [
  {
    nameKey: "home",
    pathPart: "home",
    icon: <Home />,
  },
  {
    nameKey: "lists",
    pathPart: "lists",
    icon: <ListTodo />,
    children: [
      {
        nameKey: "templates",
        pathPart: "templates",
        icon: <LayoutTemplateIcon />,
      },
    ],
  },
  {
    nameKey: "calendar",
    pathPart: "calendar",
    icon: <Calendar />,
  },
  {
    nameKey: "expenses",
    pathPart: "expenses",
    icon: <HandCoins />,
  },
  {
    nameKey: "files",
    pathPart: "files",
    icon: <FolderOpen />,
  },
  {
    nameKey: "notes",
    pathPart: "notes",
    icon: <FileTextIcon />,
  },
  {
    nameKey: "secretSanta",
    pathPart: "secret-santa",
    icon: <GiftIcon />,
    children: [
      {
        nameKey: "ideas",
        pathPart: "ideas",
        icon: <LightbulbIcon />,
        isActive: (project) =>
          project.secretSantas.some(
            (s) => s.assignmentsDone && s.datetime > new Date(),
          ),
      },
    ],
  },
];

function isItemAvailable(item: MenuItemPart, project: Project) {
  if (item.pathPart === "secret-santa" && !project.features.secretSanta) {
    return false;
  }
  return item.isActive === undefined || item.isActive(project);
}

/**
 * Returns the section path part to navigate to when switching to `project`,
 * preserving `currentSection` if it is available in the target project and
 * falling back to the default section otherwise.
 */
export function resolveSectionForProject(
  project: Project,
  currentSection: string | undefined,
): string {
  if (!currentSection) {
    return DEFAULT_SECTION;
  }
  const item = itemParts.find((i) => i.pathPart === currentSection);
  if (item && isItemAvailable(item, project)) {
    return currentSection;
  }
  return DEFAULT_SECTION;
}

export function useMenuItems(): MenuItem[] {
  const { project: selectedProject } = useProjects();
  const params = useParams<{ projectId?: string }>();
  const t = useTranslations("nav");

  const urlProjectId = params?.projectId;
  const effectiveProjectId = selectedProject?.id ?? urlProjectId;

  const enabledFeatureItemParts = useMemo(() => {
    return itemParts.filter((item) => {
      switch (item.pathPart) {
        case "secret-santa":
          return selectedProject?.features.secretSanta ?? false;
        default:
          return true;
      }
    });
  }, [selectedProject]);

  const activeItemParts = useMemo(() => {
    return enabledFeatureItemParts
      .filter((item) => {
        if (selectedProject === null) {
          return item.isActive === undefined;
        }

        return item.isActive === undefined || item.isActive(selectedProject);
      })
      .map((item) => {
        const children = item.children?.filter((child) => {
          if (selectedProject === null) {
            return child.isActive === undefined;
          }
          return (
            child.isActive === undefined || child.isActive(selectedProject)
          );
        });

        return {
          ...item,
          children:
            children?.length && children.length > 0 ? children : undefined,
        };
      });
  }, [enabledFeatureItemParts, selectedProject]);

  const items = useMemo(() => {
    return activeItemParts.map(
      ({ nameKey, pathPart, icon, disabled, children }) => {
        const path = `/groups/[projectId]/${pathPart}`;
        const href: MenuItemHref = effectiveProjectId
          ? {
              pathname: path,
              params: { projectId: effectiveProjectId },
            }
          : "#";

        return {
          name: t(nameKey),
          href,
          path,
          section: pathPart,
          icon,
          disabled,
          children: children?.map(
            ({
              nameKey: childNameKey,
              pathPart: childPathPart,
              icon,
              disabled,
            }) => {
              const childTemplate = `/groups/[projectId]/${pathPart}/${childPathPart}`;
              return {
                name: t(childNameKey),
                href: effectiveProjectId
                  ? {
                      pathname: childTemplate,
                      params: { projectId: effectiveProjectId },
                    }
                  : ("#" as MenuItemHref),
                path: childTemplate,
                section: pathPart,
                icon,
                disabled,
              };
            },
          ),
        };
      },
    );
  }, [activeItemParts, effectiveProjectId, t]);

  return items;
}

// Four content tabs (Home / Lists / Calendar / Expenses) plus a trailing
// "More", matching the native bottom bar — overflow sections (Files, Notes) live
// under More.
const MAX_BOTTOM_NAV_ITEMS = 4;

export type BottomNavItem = MenuItem & {
  overflow?: MenuItem[];
};

export function useBottomNavItems(): BottomNavItem[] {
  const menuItems = useMenuItems();
  const t = useTranslations("nav");

  return useMemo(() => {
    const visible = menuItems.slice(0, MAX_BOTTOM_NAV_ITEMS);
    const overflow = menuItems.slice(MAX_BOTTOM_NAV_ITEMS);

    const moreItem: BottomNavItem = {
      name: t("more"),
      href: "#",
      path: "#more",
      section: "more",
      icon: <EllipsisIcon />,
      overflow,
    };

    return [...visible, moreItem];
  }, [menuItems, t]);
}

export function useSubsectionItems(): MenuItem[] {
  const menuItems = useMenuItems();
  const pathname = usePathname();

  return useMemo(() => {
    const activeParent = menuItems.find(
      (item) => item.path !== "#" && pathname.startsWith(item.path),
    );

    if (!activeParent?.children?.length) {
      return [];
    }

    return [activeParent, ...activeParent.children];
  }, [menuItems, pathname]);
}
