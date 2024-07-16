// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import getFiles from "@/server/files";

export type File = Awaited<ReturnType<typeof getFiles>>[number];
