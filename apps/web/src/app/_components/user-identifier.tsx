"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { useSession } from "@/lib/session";

export default function UserIdentifier() {
  const session = useSession();

  useEffect(() => {
    if (!session.data) {
      posthog.reset();
      return;
    }

    posthog.identify(session.data.user.id, {
      email: session.data.user.email,
      name: session.data.user.name,
    });
  }, [session.data]);

  return null;
}
