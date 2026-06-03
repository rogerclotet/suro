"use client";

import { useIsFetching } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";
import { useSyncStatus } from "@/lib/offline/use-sync-status";

export function SyncIndicator() {
  const fetchingCount = useIsFetching();
  const { isSyncing } = useSyncStatus();

  if (fetchingCount === 0 && !isSyncing) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="flex items-center justify-center p-1"
          role="status"
          aria-label="Sincronitzant"
        >
          <RefreshCw className="size-4 animate-spin text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent>Sincronitzant</TooltipContent>
    </Tooltip>
  );
}
