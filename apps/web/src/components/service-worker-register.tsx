"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    // The service worker caches the built app shell + hashed chunks. In dev that
    // fights Turbopack/HMR: after a rebuild it serves stale chunks (or fails to
    // fetch the new ones), producing ChunkLoadError reload loops that a `.next`
    // wipe can't fix because the stale assets live in the browser's Cache Storage.
    // So register only in production, and actively tear down any SW a previous
    // session left behind so a dev machine self-heals on the next load.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
      return;
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[sw] Service worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("[sw] Service worker registration failed:", error);
      });
  }, []);

  return null;
}
