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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

export default function NotificationToggle() {
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
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      {enabled ? <Bell /> : <BellOff />}
      <span>Notificacions</span>
      <Switch
        checked={enabled}
        onCheckedChange={toggleSubscription}
        className="ml-auto"
      />
    </DropdownMenuItem>
  );
}
