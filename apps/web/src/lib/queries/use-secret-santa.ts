"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  adaptGiftIdea,
  adaptSecretSanta,
  type GiftIdea,
  type SecretSanta,
} from "@/app/_data/secret-santa";

/** The group's active Secret Santa; `null` when there is none. */
export function useCurrentSecretSanta(
  projectId: string,
): SecretSanta | null | undefined {
  const data = useQuery(api.secretSantas.current, {
    projectId: projectId as Id<"projects">,
  });
  if (data === undefined) {
    return undefined;
  }
  return data === null ? null : adaptSecretSanta(data);
}

/** The signed-in participant's own gift ideas. */
export function useMyGiftIdeas(
  secretSantaId: string | undefined,
): GiftIdea[] | undefined {
  const data = useQuery(
    api.secretSantas.myGiftIdeas,
    secretSantaId
      ? { secretSantaId: secretSantaId as Id<"secretSantas"> }
      : "skip",
  );
  return data?.map(adaptGiftIdea);
}
