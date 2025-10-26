"use client";

import { Bell, BellOff } from "lucide-react";
import React from "react";
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
  const [unsupported, setUnsupported] = React.useState<boolean>(true);
  const [enabled, setEnabled] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    const isUnsupported = notificationUnsupported();
    setUnsupported(isUnsupported);
    if (isUnsupported) {
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
  }, []);

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
