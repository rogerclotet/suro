// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { getProjectSpendings } from "@/server/spendings";

export type Spending = Awaited<ReturnType<typeof getProjectSpendings>>[number];
