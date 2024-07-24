"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Rows3 } from "lucide-react";
import { useFileView } from "../_state/file-view-state";

export default function ViewSelector() {
  const { view, setView } = useFileView();

  if (view === "list") {
    return (
      <Button
        onClick={() => setView("grid")}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <LayoutGrid />
        Grella
      </Button>
    );
  }

  return (
    <Button
      onClick={() => setView("list")}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Rows3 />
      Llista
    </Button>
  );
}
