import type { getNotes } from "@/server/notes";

export type Note = Awaited<ReturnType<typeof getNotes>>[number];
