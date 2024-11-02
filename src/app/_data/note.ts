// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { getNotes } from "@/server/notes";

export type Note = Awaited<ReturnType<typeof getNotes>>[number];
