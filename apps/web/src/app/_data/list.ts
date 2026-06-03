import type { getLists, getTemplates } from "@/server/lists";

export type List = Awaited<ReturnType<typeof getLists>>[number];
export type ListItem = List["items"][number];

export type Template = Awaited<ReturnType<typeof getTemplates>>[number];
export type TemplateItem = Template["items"][number];
