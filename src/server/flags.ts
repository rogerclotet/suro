"use server";

import type { Flags } from "@/app/_state/flags-state";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";

export async function getFlags() {
  const session = await auth();
  if (!session?.user.id || !session?.user.email) {
    return {
      notes: false,
      amicInvisible: false,
    };
  }

  const remoteFlags = await getPostHogServer().getAllFlags(session.user.id, {
    personProperties: { email: session.user.email },
  });

  const flags = {
    notes: remoteFlags.notes === true,
    amicInvisible: remoteFlags["amic-invisible"] === true,
  } satisfies Flags;

  return flags;
}
