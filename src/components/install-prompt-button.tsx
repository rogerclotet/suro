"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt: () => Promise<void>;
};

export function InstallPromptButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [status, setStatus] = useState<string>("waiting");

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setStatus("ready");
      console.log("[install] beforeinstallprompt fired");
    };
    const onInstalled = () => {
      setDeferred(null);
      setStatus("installed");
      console.log("[install] appinstalled fired");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (status === "installed") return null;
  if (!deferred) return null;

  return (
    <div className="fixed top-2 left-1/2 z-[60] -translate-x-1/2">
      <Button
        type="button"
        onClick={async () => {
          setStatus("prompting");
          await deferred.prompt();
          const { outcome } = await deferred.userChoice;
          setStatus(`outcome: ${outcome}`);
          console.log("[install] userChoice:", outcome);
          setDeferred(null);
        }}
      >
        Install Suro ({status})
      </Button>
    </div>
  );
}
