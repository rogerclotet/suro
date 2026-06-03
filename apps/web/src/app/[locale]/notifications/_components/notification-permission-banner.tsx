"use client";

import { Bell, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  enableNotifications,
  notificationUnsupported,
  registerAndSubscribe,
} from "@/app/push";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function NotificationPermissionBanner() {
  const t = useTranslations("notifications");
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );

  useEffect(() => {
    if (notificationUnsupported()) return;
    setPermission(Notification.permission);
  }, []);

  if (!permission || permission === "granted") return null;

  async function handleEnable() {
    await registerAndSubscribe(() => {
      enableNotifications();
      setPermission(Notification.permission);
    });
    setPermission(Notification.permission);
  }

  if (permission === "default") {
    return (
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{t("permissionPromptBanner")}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEnable}
            className="shrink-0"
          >
            {t("permissionEnable")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <ShieldAlert className="h-4 w-4" />
      <AlertDescription>
        <p>{t("permissionDeniedBanner")}</p>
        <p className="mt-1 text-xs">{t("permissionDeniedHint")}</p>
      </AlertDescription>
    </Alert>
  );
}
