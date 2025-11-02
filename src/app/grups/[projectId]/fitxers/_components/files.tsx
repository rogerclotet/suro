"use client";

import type { File } from "@/app/_data/file";
import { useFileView } from "../_state/file-view-state";
import GridView from "./grid-view/grid-view";
import ListView from "./list-view/list-view";

export default function Files({ files }: { files: File[] }) {
  const { view } = useFileView();

  const projectFiles = files.filter((f) => f.eventId === null);
  const eventFiles = files.filter((f) => f.eventId);

  if (view === "grid") {
    return (
      <div className="space-y-8">
        <GridView files={projectFiles} />

        {eventFiles.length > 0 && (
          <div>
            <h3 className="mb-4 font-semibold text-lg">
              {"Fitxers d'esdeveniments"}
            </h3>
            <GridView files={eventFiles} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ListView files={projectFiles} />

      {eventFiles.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold text-lg">
            {"Fitxers d'esdeveniments"}
          </h3>
          <ListView files={eventFiles} />
        </div>
      )}
    </div>
  );
}
