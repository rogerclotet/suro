"use client";

import { WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";
import { syncManager } from "@/lib/offline/sync-manager";

async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch("/api/health", {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const isOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const goOnline = useCallback(async () => {
    setIsOnline(true);
    await syncManager.resetNetworkFailedRetries();
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    const stillOnline = await checkHealth();
    if (stillOnline) {
      syncManager.processQueue();
    } else {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    syncManager.init();

    const initCheck = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      const online = await checkHealth();
      setIsOnline(online);
    };
    initCheck();

    const handleOnline = async () => {
      const online = await checkHealth();
      if (online) goOnline();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      syncManager.destroy();
    };
  }, [goOnline]);

  useEffect(() => {
    if (!mounted) return;

    const intervalId = setInterval(async () => {
      const currentStatus = isOnlineRef.current;
      const online = await checkHealth();

      if (online && currentStatus !== true) {
        goOnline();
      } else if (!online && currentStatus === true) {
        setIsOnline(false);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [mounted, goOnline]);

  if (!mounted || isOnline !== false) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="flex items-center justify-center p-1"
          role="img"
          aria-label="Sense connexió"
        >
          <WifiOff className="size-4 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent>Sense connexió</TooltipContent>
    </Tooltip>
  );
}
