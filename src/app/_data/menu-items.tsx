import { CookingPot, ListTodo } from "lucide-react";

export type MenuItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

export const menuItems: MenuItem[] = [
  {
    name: "Llistes",
    path: "/llistes",
    icon: <ListTodo />,
  },
  {
    name: "Receptes",
    path: "/receptes",
    icon: <CookingPot />,
    disabled: true,
  },
];
