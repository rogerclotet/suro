import type {} from "@redux-devtools/extension"; // required for devtools typing
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface FileViewState {
  view: "grid" | "list";
  setView: (view: FileViewState["view"]) => void;
}

export const useFileView = create<FileViewState>()(
  devtools(
    (set) => ({
      view: "grid",
      setView: (view) => set({ view }),
    }),
    { name: "FileViewState" },
  ),
);
