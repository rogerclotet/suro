"use client";

import { Bell, BellOff, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  areNotificationsEnabled,
  disableNotifications,
  enableNotifications,
  notificationUnsupported,
  registerAndSubscribe,
} from "@/app/push";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type PermissionState = "granted" | "denied" | "default";

export default function NotificationSettings() {
  const t = useTranslations("profile");
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [appEnabled, setAppEnabled] = useState(false);

  useEffect(() => {
    if (notificationUnsupported()) return;
    setPermission(Notification.permission as PermissionState);
    setAppEnabled(areNotificationsEnabled() === true);
  }, []);

  if (!permission) return null;

  async function handleEnable() {
    await registerAndSubscribe(() => {
      enableNotifications();
      setAppEnabled(true);
      toast.success(t("pushNotificationsSuccess"));
    });
    setPermission(Notification.permission as PermissionState);
  }

  async function handleToggle(checked: boolean) {
    if (checked) {
      await registerAndSubscribe(() => {
        enableNotifications();
        setAppEnabled(true);
        toast.success(t("pushNotificationsSuccess"));
      });
    } else {
      disableNotifications();
      setAppEnabled(false);
      toast.success(t("pushNotificationsDisabledToast"));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-medium text-base">
          {t("pushNotifications")}
        </Label>
        {permission === "granted" && (
          <Badge variant="default">{t("pushNotificationsGranted")}</Badge>
        )}
        {permission === "denied" && (
          <Badge variant="destructive">{t("pushNotificationsDenied")}</Badge>
        )}
        {permission === "default" && (
          <Badge variant="secondary">{t("pushNotificationsPrompt")}</Badge>
        )}
      </div>

      {permission === "denied" && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            {t("pushNotificationsDeniedHint")}
          </AlertDescription>
        </Alert>
      )}

      {permission === "default" && (
        <Button variant="outline" onClick={handleEnable}>
          <Bell className="mr-2 h-4 w-4" />
          {t("pushNotificationsEnable")}
        </Button>
      )}

      {permission === "granted" && (
        <div className="flex items-center gap-3">
          {appEnabled ? (
            <Bell className="h-4 w-4 text-muted-foreground" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="flex-1 text-muted-foreground text-sm">
            {appEnabled
              ? t("pushNotificationsActive")
              : t("pushNotificationsDisable")}
          </span>
          <Switch checked={appEnabled} onCheckedChange={handleToggle} />
        </div>
      )}
    </div>
  );
}
