"use client";

import React from "react";
import {
  checkPermissionStateAndAct,
  notificationUnsupported,
  registerAndSubscribe,
} from "../push";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendPush } from "../api/web-push/[...path]/api";

export default function TestPage() {
  const [unsupported, setUnsupported] = React.useState<boolean>(false);
  const [subscription, setSubscription] =
    React.useState<PushSubscription | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const isUnsupported = notificationUnsupported();
    setUnsupported(isUnsupported);
    if (isUnsupported) {
      return;
    }

    checkPermissionStateAndAct(setSubscription).catch((err) => {
      console.error("Failed to check notification permission", err);
    });
  }, []);

  async function sendTestPush() {
    await sendPush(message ?? "");
    setMessage(null);
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        disabled={unsupported}
        onClick={() => registerAndSubscribe(setSubscription)}
      >
        {unsupported
          ? "Notification Unsupported"
          : subscription
            ? "Notification allowed"
            : "Allow notification"}
      </Button>

      <code>
        {subscription
          ? JSON.stringify(subscription?.toJSON(), undefined, 2)
          : "There is no subscription"}
      </code>

      {subscription ? (
        <div className="flex gap-4">
          <Input
            placeholder={"Type push message ..."}
            value={message ?? ""}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={sendTestPush} disabled={!message}>
            Test Web Push
          </Button>
        </div>
      ) : null}
    </div>
  );
}
