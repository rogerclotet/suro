import type { getPot, getProjectPots } from "@/server/pots";

export type Pot = Awaited<ReturnType<typeof getProjectPots>>[number];
export type PotDetail = NonNullable<Awaited<ReturnType<typeof getPot>>>;
