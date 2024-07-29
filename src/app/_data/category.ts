// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { getCategories } from "@/server/categories";

export type Category = Awaited<ReturnType<typeof getCategories>>[number];
