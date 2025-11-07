import type { LucideIcon } from "lucide-react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Action {
  label: string;
  icon: LucideIcon;
  pathParts?: string[];
  onClick?: () => void;
}

export interface ActionState {
  action: Action | null;
  setAction: (action: Action | null) => void;
}

export const useActionState = create<ActionState>()(
  devtools(
    (set) => ({
      action: null,
      setAction: (action) => set({ action }),
    }),
    { name: "ActionState" },
  ),
);

export function useAction() {
  const action = useActionState((state) => state.action);
  const setAction = useActionState((state) => state.setAction);

  return { action, setAction };
}
