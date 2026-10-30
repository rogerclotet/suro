/**
 * Which unread receipts a screen reads. Both clients map their routes to a
 * `NotificationVisit` and share these rules, so a list read on the phone and
 * on the web clears the same receipts.
 *
 * The shapes mirror `notifications.unread` structurally, keeping this module
 * free of Convex types. `Id` stays generic so callers keep their branded ids.
 */

export type UnreadItem<Id extends string = string> = {
  /** The document the receipts are about: a list, template, event, pot or note. */
  id: string;
  ids: readonly Id[];
  /** The item was deleted or moved, so no screen is left to read it on. */
  gone: boolean;
};

export type UnreadReceipts<Id extends string = string> = {
  projectId: string;
  section: string;
  ids: readonly Id[];
  targets: readonly UnreadItem<Id>[];
};

export type NotificationVisit =
  /** A page that shows its whole section at once: files, members, Secret Santa. */
  | { projectId: string; scope: "page"; section: string }
  /** A section index. It only clears items that no longer exist. */
  | { projectId: string; scope: "index"; section: string }
  /** One item's own screen. */
  | { projectId: string; scope: "item"; id: string };

function readIds<Id extends string>(
  receipt: UnreadReceipts<Id>,
  visit: NotificationVisit,
): readonly Id[] {
  if (receipt.projectId !== visit.projectId) return [];
  switch (visit.scope) {
    case "page":
      return receipt.section === visit.section ? receipt.ids : [];
    case "index":
      return receipt.section === visit.section
        ? receipt.targets
            .filter((target) => target.gone)
            .flatMap((target) => target.ids)
        : [];
    case "item":
      return receipt.targets
        .filter((target) => target.id === visit.id)
        .flatMap((target) => target.ids);
  }
}

export function visitedReceiptIds<Id extends string>(
  receipts: readonly UnreadReceipts<Id>[],
  visit: NotificationVisit,
): Id[] {
  return receipts.flatMap((receipt) => readIds(receipt, visit));
}

export function unreadItemCount(
  receipts: readonly UnreadReceipts[],
  projectId: string,
  id: string,
): number {
  let count = 0;
  for (const receipt of receipts) {
    if (receipt.projectId !== projectId) continue;
    for (const target of receipt.targets) {
      if (target.id === id) count += target.ids.length;
    }
  }
  return count;
}
