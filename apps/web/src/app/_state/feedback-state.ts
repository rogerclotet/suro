import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface FeedbackState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useFeedbackState = create<FeedbackState>()(
  devtools(
    (set) => ({
      open: false,
      setOpen: (open) => set({ open }),
    }),
    { name: "FeedbackState" },
  ),
);

export function useFeedback() {
  const open = useFeedbackState((state) => state.open);
  const setOpen = useFeedbackState((state) => state.setOpen);

  return {
    open,
    setOpen,
    openFeedback: () => setOpen(true),
    closeFeedback: () => setOpen(false),
  };
}
