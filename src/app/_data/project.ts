import type { projects } from "@/server/db/schema";

export type Project = typeof projects.$inferSelect;
