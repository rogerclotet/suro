"use client";

import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useEffect } from "react";

export default function UserIdentifer() {
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
