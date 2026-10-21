import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type SecretSanta = NonNullable<
  FunctionReturnType<typeof api.secretSantas.current>
>;
export type Person = SecretSanta["participants"][number];
export type GiftIdea = FunctionReturnType<
  typeof api.secretSantas.myGiftIdeas
>[number];
