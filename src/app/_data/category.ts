// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { getCategories } from "@/server/categories";

export type Category = Awaited<ReturnType<typeof getCategories>>[number];
