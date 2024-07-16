"use client";

import type { File } from "@/app/_data/file";
import GridView from "./_components/grid-view/grid-view";
import ListView from "./_components/list-view/list-view";
import { useFileView } from "./_state/file-view-state";

export default function Files({ files }: { files: File[] }) {
  const { view } = useFileView();

  if (view === "grid") {
    return <GridView files={files} />;
  }

  return <ListView files={files} />;
}
