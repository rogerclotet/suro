"use client";

import { Fingerprint } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/app/_data/project";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";

export default function IdIcon({ id }: { id: Project["id"] }) {
  async function copyIdToClipboard(id: string) {
    await navigator.clipboard.writeText(id);
    toast.info("Copiat al porta-retalls");
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => copyIdToClipboard(id)}
        >
          <Fingerprint />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{id}</p>
      </TooltipContent>
    </Tooltip>
  );
}
