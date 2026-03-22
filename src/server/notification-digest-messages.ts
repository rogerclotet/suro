export type DigestType = "list_items_completed" | "list_items_added";

export function getNotificationDigestBody({
  actorName,
  count,
  listName,
  type,
}: {
  actorName: string;
  count: number;
  listName: string;
  type: DigestType;
}) {
  const noun = count === 1 ? "element" : "elements";

  switch (type) {
    case "list_items_completed":
      return `${actorName} ha marcat ${count} ${noun} com a completats a la llista ${listName}`;
    case "list_items_added":
      return `${actorName} ha afegit ${count} ${noun} a la llista ${listName}`;
  }
}
