// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { getLists } from "@/server/lists";

export type List = Awaited<ReturnType<typeof getLists>>[number];
