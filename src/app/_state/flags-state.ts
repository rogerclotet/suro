import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Flags {
  amicInvisible: boolean;
}

export interface FlagsState {
  flags: Flags;
  setFlags: (flags: Flags) => void;
}

export const useFlagsState = create<FlagsState>()(
  devtools(
    (set) => ({
      flags: {
        amicInvisible: false,
      },
      setFlags: (flags) => set({ flags }),
    }),
    { name: "FlagsState" },
  ),
);

export function useFlags() {
  const flags = useFlagsState((state) => state.flags);
  const setFlags = useFlagsState((state) => state.setFlags);

  return { flags, setFlags };
}
