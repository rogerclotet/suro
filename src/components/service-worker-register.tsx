"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[sw] Service worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[sw] Service worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
