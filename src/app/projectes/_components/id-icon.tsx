"use client";

import type { Project } from "@/app/_data/project";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";

export default function IdIcon({ id }: { id: Project["id"] }) {
  async function copyIdToClipboard(id: string) {
    await navigator.clipboard.writeText(id);
    toast.info("Copiat al porta-retalls");
  }

  return (
    <div
      onClick={() => copyIdToClipboard(id)}
      className="tooltip tooltip-right cursor-pointer"
      data-tip={id}
    >
      <Fingerprint />
    </div>
  );
}
