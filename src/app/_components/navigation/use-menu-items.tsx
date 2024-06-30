import { useSelectedProject } from "@/app/_state/project-state";
import { CookingPot, ListTodo } from "lucide-react";
import React from "react";

export type MenuItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

type MenuItemPart = {
  name: string;
  pathPart: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

const itemParts: MenuItemPart[] = [
  {
    name: "Llistes",
    pathPart: "llistes",
    icon: <ListTodo />,
  },
  {
    name: "Receptes",
    pathPart: "receptes",
    icon: <CookingPot />,
    disabled: true,
  },
];

export function useMenuItems(): MenuItem[] {
  const { project: selectedProject } = useSelectedProject();

  const items = React.useMemo(() => {
    if (selectedProject === null) {
      return itemParts.map(({ name, icon, disabled }) => ({
        name,
        path: "/",
        icon,
        disabled,
      }));
    }

    return itemParts.map(({ name, pathPart, icon, disabled }) => ({
      name,
      path: `/projectes/${selectedProject.id}/${pathPart}`,
      icon,
      disabled,
    }));
  }, [selectedProject]);

  return items;
}
