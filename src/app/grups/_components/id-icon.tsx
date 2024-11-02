"use client";

import type { Project } from "@/app/_data/project";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";

export default function IdIcon({ id }: { id: Project["id"] }) {
  async function copyIdToClipboard(id: string) {
    await navigator.clipboard.writeText(id);
    toast.info("Copiat al porta-retalls");
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div onClick={() => copyIdToClipboard(id)}>
          <Fingerprint />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{id}</p>
      </TooltipContent>
    </Tooltip>
  );
}
