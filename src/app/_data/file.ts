// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type getProjectFiles from "@/server/files";

export type File = Awaited<ReturnType<typeof getProjectFiles>>[number];
