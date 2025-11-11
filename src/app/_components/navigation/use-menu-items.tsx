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
import type { Project } from "@/app/_data/project";
import { useFlags } from "@/app/_state/flags-state";
import { useProjects } from "@/app/_state/project-state";

export type MenuItem = {
  name: string;
  path: string;
  icon: ReactNode;
  disabled?: boolean;
  children?: MenuItem[];
  isActive?: (project: Project) => boolean;
};

type MenuItemPart = {
  name: string;
  pathPart: string;
  icon: ReactNode;
  disabled?: boolean;
  children?: MenuItemPart[];
  isActive?: (project: Project) => boolean;
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
        isActive: (project) =>
          project.secretSantas.some(
            (s) => s.assignmentsDone && s.datetime > new Date(),
          ),
      },
    ],
  },
];

export function useMenuItems(): MenuItem[] {
  const { project: selectedProject } = useProjects();
  const { flags } = useFlags();

  const enabledFeatureItemParts = useMemo(() => {
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
      ({ name, pathPart, icon, disabled, children }) => ({
        name,
        path: selectedProject
          ? `/grups/${selectedProject.id}/${pathPart}`
          : "#",
        icon,
        disabled,
        children: children?.map(
          ({ name, pathPart: childPathPart, icon, disabled }) => ({
            name,
            path: selectedProject
              ? `/grups/${selectedProject.id}/${pathPart}/${childPathPart}`
              : "#",
            icon,
            disabled,
          }),
        ),
      }),
    );
  }, [activeItemParts, selectedProject]);

  return items;
}
