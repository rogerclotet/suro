"use client";

import type { File } from "@/app/_data/file";
import { useFileView } from "../_state/file-view-state";
import GridView from "./grid-view/grid-view";
import ListView from "./list-view/list-view";

export default function Files({ files }: { files: File[] }) {
  const { view } = useFileView();

  if (view === "grid") {
    return <GridView files={files} />;
  }

  return <ListView files={files} />;
}
