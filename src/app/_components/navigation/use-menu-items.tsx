import {
  Calendar,
  FolderOpen,
  GiftIcon,
  HandCoins,
  LayoutTemplateIcon,
  ListTodo,
  TagsIcon,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { useProjects } from "@/app/_state/project-state";

export type MenuItem = {
  name: string;
  path: string;
  icon: ReactNode;
  disabled?: boolean;
  children?: MenuItem[];
};

type MenuItemPart = {
  name: string;
  pathPart: string;
  icon: ReactNode;
  disabled?: boolean;
  children?: MenuItemPart[];
};

const itemParts: MenuItemPart[] = [
  {
    name: "Llistes",
    pathPart: "llistes",
    icon: <ListTodo />,
    children: [
      {
        name: "Plantilles",
        pathPart: "plantilles",
        icon: <LayoutTemplateIcon />,
      },
      {
        name: "Categories",
        pathPart: "categories",
        icon: <TagsIcon />,
      },
    ],
  },
  {
    name: "Calendari",
    pathPart: "calendari",
    icon: <Calendar />,
  },
  {
    name: "Fitxers",
    pathPart: "fitxers",
    icon: <FolderOpen />,
  },
  {
    name: "Despeses",
    pathPart: "despeses",
    icon: <HandCoins />,
  },
  {
    name: "Amic Invisible",
    pathPart: "amic-invisible",
    icon: <GiftIcon />,
  },
];

export function useMenuItems(): MenuItem[] {
  const { project: selectedProject } = useProjects();

  const items = useMemo(() => {
    if (selectedProject === null) {
      return itemParts.map(({ name, icon, disabled, children }) => ({
        name,
        path: "/",
        icon,
        disabled,
        children: children?.map(({ name, icon, disabled }) => ({
          name,
          path: "/",
          icon,
          disabled,
        })),
      }));
    }

    return itemParts.map(({ name, pathPart, icon, disabled, children }) => ({
      name,
      path: `/grups/${selectedProject.id}/${pathPart}`,
      icon,
      disabled,
      children: children?.map(
        ({ name, pathPart: childPathPart, icon, disabled }) => ({
          name,
          path: `/grups/${selectedProject.id}/${pathPart}/${childPathPart}`,
          icon,
          disabled,
        }),
      ),
    }));
  }, [selectedProject]);

  return items;
}
