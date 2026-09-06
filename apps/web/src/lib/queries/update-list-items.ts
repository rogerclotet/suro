import { api } from "backend/convex/_generated/api";
import type { Doc, Id } from "backend/convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";

/** Keep every subscribed representation of a checklist in the same optimistic state. */
export function updateListItems(
  store: OptimisticLocalStore,
  list: { id: string; projectId: string; eventId: string | null },
  update: (items: Doc<"listItems">[]) => Doc<"listItems">[],
) {
  const listId = list.id as Id<"lists">;
  const detail = store.getQuery(api.lists.get, { listId });
  if (detail)
    store.setQuery(
      api.lists.get,
      { listId },
      { ...detail, items: update(detail.items) },
    );
  const projectId = list.projectId as Id<"projects">;
  const lists = store.getQuery(api.lists.listByProject, { projectId });
  if (lists)
    store.setQuery(
      api.lists.listByProject,
      { projectId },
      lists.map((row) =>
        row._id === listId ? { ...row, items: update(row.items) } : row,
      ),
    );
  if (list.eventId) {
    const eventId = list.eventId as Id<"events">;
    const event = store.getQuery(api.events.get, { eventId });
    if (event?.list)
      store.setQuery(
        api.events.get,
        { eventId },
        { ...event, list: { ...event.list, items: update(event.list.items) } },
      );
  }
}
