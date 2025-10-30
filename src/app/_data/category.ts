import type { getCategories } from "@/server/categories";

export type Category = Awaited<ReturnType<typeof getCategories>>[number];
