"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  areNotificationsEnabled,
  checkPermissionStateAndAct,
  disableNotifications,
  enableNotifications,
  notificationUnsupported,
  registerAndSubscribe,
} from "@/app/push";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const [enabled, setEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const unsupported = notificationUnsupported();

  useEffect(() => {
    if (unsupported) {
      return;
    }

    checkPermissionStateAndAct(() => {
      let enabled = areNotificationsEnabled();
      if (enabled === undefined) {
        enableNotifications();
        enabled = true;
      }
      setEnabled(enabled);
    })
      .then(() => {
        setInitialized(true);
      })
      .catch((err) => {
        console.error("Failed to check notification permission", err);
      });
  }, [unsupported]);

  async function toggleSubscription() {
    setEnabled(!enabled);

    if (enabled) {
      disableNotifications();
      toast.success("Notificacions desactivades");
    } else {
      await registerAndSubscribe(() => {
        enableNotifications();
        toast.success("Notificacions activades");
      });
    }
  }

  if (!initialized || unsupported) {
    return null;
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleSubscription}>
      {enabled ? <Bell /> : <BellOff />}
    </Button>
  );
}
