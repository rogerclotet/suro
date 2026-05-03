import { translateNotificationBody } from "./notification-i18n";

export type DigestType = "list_items_completed" | "list_items_added";

export function getNotificationDigestParams({
  actorName,
  count,
  listName,
}: {
  actorName: string;
  count: number;
  listName: string;
}) {
  return { actorName, count, listName };
}

export async function getNotificationDigestBody({
  actorName,
  count,
  listName,
  type,
  locale,
}: {
  actorName: string;
  count: number;
  listName: string;
  type: DigestType;
  locale?: string | null;
}) {
  return translateNotificationBody(
    type,
    getNotificationDigestParams({ actorName, count, listName }),
    locale,
  );
}
