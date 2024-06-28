import { useSelectedProject } from "@/app/_state/project-state";
import { CookingPot, ListTodo } from "lucide-react";

export type MenuItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

export function useMenuItems() {
  const { selectedProjectId } = useSelectedProject();

  const menuItems: MenuItem[] = [
    {
      name: "Llistes",
      path: `/projectes/${selectedProjectId}/llistes`,
      icon: <ListTodo />,
    },
    {
      name: "Receptes",
      path: `/projectes/${selectedProjectId}/receptes`,
      icon: <CookingPot />,
      disabled: true,
    },
  ];

  return menuItems;
}
