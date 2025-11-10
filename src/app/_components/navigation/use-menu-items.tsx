"use client";

import {
  Calendar,
  FileTextIcon,
  FolderOpen,
  GiftIcon,
  HandCoins,
  LayoutTemplateIcon,
  LightbulbIcon,
  ListTodo,
  TagsIcon,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { useFlags } from "@/app/_state/flags-state";
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
    name: "Notes",
    pathPart: "notes",
    icon: <FileTextIcon />,
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
    children: [
      {
        name: "Llista d'idees",
        pathPart: "idees",
        icon: <LightbulbIcon />,
      },
    ],
  },
];

export function useMenuItems(): MenuItem[] {
  const { project: selectedProject } = useProjects();
  const { flags } = useFlags();

  const filteredItemParts = useMemo(() => {
    return itemParts.filter((item) => {
      switch (item.pathPart) {
        case "notes":
          return flags.notes;
        case "amic-invisible":
          return flags.amicInvisible;
        default:
          return true;
      }
    });
  }, [flags]);

  const items = useMemo(() => {
    if (selectedProject === null) {
      return filteredItemParts.map(({ name, icon, disabled, children }) => ({
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

    return filteredItemParts.map(
      ({ name, pathPart, icon, disabled, children }) => ({
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
      }),
    );
  }, [selectedProject, filteredItemParts]);

  return items;
}
